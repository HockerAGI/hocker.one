import { pathToFileURL } from "node:url";

export const SERVICE = "hocker-nova-coordinator";
export const TITLE = "[HOCKER] NOVA Cron observation missing";
const LOOKBACK_MS = 50 * 60_000;
const FRESH_MS = 45 * 60_000;

export function assess(events, now = Date.now()) {
  if (!Array.isArray(events)) throw Error("CRON_SCHEMA_INVALID");
  const valid = events.filter((e) => e?.$metadata?.service === SERVICE &&
    e?.source?.event === "coordinator_observation" &&
    e?.source?.code === "COORDINATOR_OBSERVED" &&
    Number.isFinite(e?.timestamp) &&
    e.timestamp <= now + 60_000 && e.timestamp >= now - LOOKBACK_MS);
  const at = valid.length ? Math.max(...valid.map((e) => e.timestamp)) : null;
  const ok = at !== null && now - at <= FRESH_MS;
  return { ok, code: ok ? "CRON_OBSERVED" : "CRON_OBSERVATION_MISSING",
    lastObservedAt: at === null ? null : new Date(at).toISOString() };
}

export async function queryTelemetry({ accountId, token, now = Date.now(), fetcher = fetch }) {
  if (!/^[0-9a-f]{32}$/i.test(String(accountId))) throw Error("CRON_ACCOUNT_INVALID");
  if (typeof token !== "string" || token.length < 20) throw Error("CRON_CLOUDFLARE_TOKEN_MISSING");
  const res = await fetcher("https://api.cloudflare.com/client/v4/accounts/" +
    accountId + "/workers/observability/telemetry/query", {
    method: "POST",
    headers: { Authorization: "Bearer " + token,
      "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      queryId: "hocker-nova-independent-cron-monitor", view: "events",
      limit: 180, timeframe: { from: now - LOOKBACK_MS, to: now },
      parameters: { datasets: [], filterCombination: "and",
        filters: [{ key: "$metadata.service", operation: "eq", type: "string", value: SERVICE }],
        limit: 180 },
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (res.status !== 200) throw Error("CRON_CLOUDFLARE_API_UNAVAILABLE");
  const response = await res.json().catch(() => { throw Error("CRON_SCHEMA_INVALID"); });
  if (response?.success !== true || !Array.isArray(response?.result?.events?.events)) {
    throw Error("CRON_SCHEMA_INVALID");
  }
  return assess(response.result.events.events, now);
}

export async function syncIncident({ assessment, token, repo, dryRun = true, fetcher = fetch }) {
  if (repo !== "HockerAGI/hocker.one") throw Error("CRON_REPO_INVALID");
  if (typeof token !== "string" || token.length < 20) throw Error("CRON_GITHUB_TOKEN_MISSING");
  if (typeof assessment?.ok !== "boolean") throw Error("CRON_ASSESSMENT_INVALID");
  const root = "https://api.github.com/repos/" + repo;
  const headers = { Authorization: "Bearer " + token,
    Accept: "application/vnd.github+json", "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28" };
  const request = async (method, path, body) => {
    const r = await fetcher(root + path, {
      method, headers, body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(12_000),
    });
    if (!r.ok) throw Error("CRON_GITHUB_API_UNAVAILABLE");
    return r.json();
  };
  const issues = await request("GET", "/issues?state=open&per_page=100");
  if (!Array.isArray(issues)) throw Error("CRON_GITHUB_SCHEMA_INVALID");
  const current = issues.find((x) => x && !x.pull_request && x.title === TITLE);
  if (dryRun) return { code: "CRON_DRY_RUN", open: Boolean(current) };
  if (!assessment.ok) {
    if (current) return { code: "CRON_INCIDENT_EXISTS", issueNumber: current.number };
    const result = await request("POST", "/issues", {
      title: TITLE,
      body: "Missing independent coordinator telemetry (not proof of a stopped Worker)." +
        "\n\nStatus: " + assessment.code +
        "\n\nLast observation: " + (assessment.lastObservedAt ?? "None in last 50 minutes") +
        "\n\nCheck Cloudflare cron schedule, observability ingestion and Hocker One logs." +
        "\n\nThis monitor cannot run AGI tasks or change Owner Gate.",
    });
    if (!Number.isInteger(result?.number)) throw Error("CRON_GITHUB_SCHEMA_INVALID");
    return { code: "CRON_INCIDENT_CREATED", issueNumber: result.number };
  }
  if (current) {
    await request("POST", "/issues/" + current.number + "/comments", {
      body: "Automated recovery: observed coordinator at " + assessment.lastObservedAt,
    });
    await request("PATCH", "/issues/" + current.number, { state: "closed" });
    return { code: "CRON_INCIDENT_RESOLVED", issueNumber: current.number };
  }
  return { code: "CRON_HEALTHY" };
}

export async function run(env = process.env, fetcher = fetch, now = Date.now()) {
  if (env.HOCKER_CRON_MONITOR_ENABLED !== "true") throw Error("CRON_NOT_ENABLED");
  const assessment = await queryTelemetry({ accountId: env.HOCKER_CLOUDFLARE_ACCOUNT_ID,
    token: env.HOCKER_CLOUDFLARE_MONITOR_TOKEN, now, fetcher });
  const action = await syncIncident({ assessment, token: env.GITHUB_TOKEN,
    repo: env.GITHUB_REPOSITORY, dryRun: env.HOCKER_CRON_MONITOR_DRY_RUN === "true", fetcher });
  return { ...assessment, action: action.code, issueNumber: action.issueNumber ?? null };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().then((status) => {
    process.stdout.write(JSON.stringify(status) + "\n");
    process.exitCode = status.ok ? 0 : 1;
  }).catch((error) => {
    const code = /^CRON_[A-Z_]+$/.test(String(error?.message)) ?
      error.message : "CRON_MONITOR_UNAVAILABLE";
    process.stderr.write(code + "\n");
    process.exitCode = 2;
  });
}
