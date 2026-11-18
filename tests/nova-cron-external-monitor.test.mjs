import test from "node:test";
import assert from "node:assert/strict";
import { assess, queryTelemetry, syncIncident, run, SERVICE, TITLE } from "../scripts/ops/monitor-nova-cron.mjs";

const NOW = Date.parse("2026-11-18T06:40:00Z");
const event = (n = 5, service = SERVICE) => ({
  timestamp: NOW - n * 60_000, $metadata: { service },
  source: { event: "coordinator_observation", code: "COORDINATOR_OBSERVED" },
});
const res = (body, status = 200) => ({ status, ok: status >= 200 && status < 300,
  async json() { return body; } });
const token = "x".repeat(32);

test("detects genuine recent observation but not unrelated/missing/stale", () => {
  assert.equal(assess([event()], NOW).code, "CRON_OBSERVED");
  assert.equal(assess([event(48)], NOW).code, "CRON_OBSERVATION_MISSING");
  assert.equal(assess([event(5, "other-worker")], NOW).ok, false);
  assert.equal(assess([event(-8)], NOW).ok, false);
  assert.throws(() => assess({}), /CRON_SCHEMA_INVALID/);
});

test("queries authentic Cloudflare events without exposing the read token", async () => {
  const calls = [];
  const fetcher = async (url, opts) => {
    calls.push({ url, opts });
    return res({ success: true, result: { events: { events: [event()] } } });
  };
  const result = await queryTelemetry({ accountId: "a".repeat(32), token, now: NOW, fetcher });
  assert.equal(result.ok, true);
  assert.equal(calls[0].url, "https://api.cloudflare.com/client/v4/accounts/" + "a".repeat(32) + "/workers/observability/telemetry/query");
  assert.equal(JSON.parse(calls[0].opts.body).parameters.filters[0].value, SERVICE);
  assert.equal(JSON.stringify(result).includes(token), false);
  await assert.rejects(() => queryTelemetry({ accountId: "a".repeat(32), token,
    fetcher: async () => res({}, 403) }), /CRON_CLOUDFLARE_API_UNAVAILABLE/);
});

test("creates one incident, no duplicate; recovery closes it; dry-run performs no writes", async () => {
  let current = null;
  const calls = [];
  const fetcher = async (url, opts) => {
    const path = new URL(url).pathname;
    calls.push(opts.method + " " + path);
    if (opts.method === "GET") return res(current ? [current] : []);
    if (opts.method === "POST" && path.endsWith("/issues")) {
      assert.equal(JSON.parse(opts.body).title, TITLE);
      current = { title: TITLE, number: 3061 };
      return res(current, 201);
    }
    if (opts.method === "POST" && path.endsWith("/comments")) return res({}, 201);
    if (opts.method === "PATCH") { current = null; return res({}); }
    throw Error("unexpected endpoint");
  };
  const input = { repo: "HockerAGI/hocker.one", token, fetcher,
    assessment: { ok: false, code: "CRON_OBSERVATION_MISSING", lastObservedAt: null } };
  assert.equal((await syncIncident({ ...input, dryRun: true })).code, "CRON_DRY_RUN");
  assert.equal(calls.filter((c) => !c.startsWith("GET")).length, 0);
  assert.equal((await syncIncident({ ...input, dryRun: false })).code, "CRON_INCIDENT_CREATED");
  assert.equal((await syncIncident({ ...input, dryRun: false })).code, "CRON_INCIDENT_EXISTS");
  assert.equal((await syncIncident({ ...input, dryRun: false,
    assessment: { ok: true, code: "CRON_OBSERVED", lastObservedAt: "2026-11-18T06:35:00Z" } })).code,
    "CRON_INCIDENT_RESOLVED");
  assert.equal(calls.filter((c) => c === "POST /repos/HockerAGI/hocker.one/issues").length, 1);
  await assert.rejects(() => syncIncident({ ...input, repo: "OtherOrg/repo" }), /CRON_REPO_INVALID/);
});
test("disabled monitor performs no external calls", async () => {
  let called = false;
  await assert.rejects(() => run({}, async () => { called = true; }, NOW), /CRON_NOT_ENABLED/);
  assert.equal(called, false);
});


test("incident lookup checks subsequent GitHub pages before creating another issue", async () => {
  const pages = [];
  let postCount = 0;
  const fetcher = async (url, options) => {
    const query = new URL(url).searchParams;
    if (options.method === "GET") {
      const page = Number(query.get("page") ?? 1);
      pages.push(page);
      if (page === 1) return res(Array.from({ length: 100 }, (_, i) => ({
        title: "Unrelated issue " + i, number: i + 1,
      })));
      if (page === 2) return res([{ title: TITLE, number: 4130 }]);
    }
    if (options.method === "POST") postCount += 1;
    throw Error("unexpected GitHub write");
  };
  const result = await syncIncident({
    repo: "HockerAGI/hocker.one",
    token,
    dryRun: false,
    assessment: { ok: false, code: "CRON_OBSERVATION_MISSING", lastObservedAt: null },
    fetcher,
  });
  assert.equal(result.code, "CRON_INCIDENT_EXISTS");
  assert.deepEqual(pages, [1, 2]);
  assert.equal(postCount, 0);
});
