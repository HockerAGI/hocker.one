import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("Owner handoff only accepts source evidence in HOCKER issue #306", () => {
  const run = spawnSync(process.execPath, [
    "--experimental-strip-types", "--input-type=module", "--eval", [
      "import assert from 'node:assert/strict';",
      "import { parseHockerChatgptHandoffUrl as parse } from './src/lib/chatgpt-handoff-review.ts';",
      "assert.equal(parse('https://github.com/HockerAGI/hocker.one/issues/306#issuecomment-6901778744'), '6901778744');",
      "assert.equal(parse('https://github.com/HockerAGI/hocker.one/issues/307#issuecomment-6901778744'), null);",
      "assert.equal(parse('https://github.com/HockerAGI/nova.agi/issues/306#issuecomment-6901778744'), null);",
      "assert.equal(parse('http://github.com/HockerAGI/hocker.one/issues/306#issuecomment-6901778744'), null);",
      "assert.equal(parse('https://evil.test/HockerAGI/hocker.one/issues/306#issuecomment-6901778744'), null);",
      "assert.equal(parse('https://github.com/HockerAGI/hocker.one/issues/306#issuecomment-6901778744?x=1'), null);",
      "assert.equal(parse('https://github.com/HockerAGI/hocker.one/issues/306#issuecomment-0'), null);",
      "assert.equal(parse(null), null);",
    ].join("\n"),
  ], { cwd: new URL("../", import.meta.url), encoding: "utf8", timeout: 10000 });
  assert.equal(run.status, 0, run.stderr);
});

test("Owner AAL2, origin, confirmation, independent GitHub GET before persistence", async () => {
  const route = await read("src/app/api/context-bridge/chatgpt/handoff-review/route.ts");
  const section = route.slice(route.indexOf("export async function POST"));
  const owner = section.indexOf('requireOwnerAal2Api("hocker-one")');
  const origin = section.indexOf("sameOrigin(request)");
  const schema = section.indexOf("Submit.safeParse");
  const github = section.indexOf("githubRead<GitHubComment>");
  const checkpoint = section.indexOf("await createContextBridgeCheckpoint");
  assert.ok(owner >= 0 && origin > owner && schema > origin &&
    github > schema && checkpoint > github);
  assert.match(route, /z\.literal\(true\)/);
  assert.match(route, /comment\.issue_url !== "https:\/\/api\.github\.com\/repos\/HockerAGI\/hocker\.one\/issues\/306"/);
  assert.match(route, /comment\.html_url !== url/);
  assert.match(route, /getGitHubRuntimeAccessToken/);
  assert.match(route, /source_body_sha256: bodySha/);
  assert.match(route, /chatgpt_provider_session_attested: false/);
  assert.match(route, /status: "partial"/);
  assert.match(route, /provider_session_verified: false/);
  assert.match(route, /coverage_upgraded: false/);
  assert.match(route, /manifest_activated: false/);
  assert.doesNotMatch(route, /record_owner_gate_approval|activate_context_bridge_manifest|createContextBridgeManifest/);
});

test("Owner handoff panel is explicit and is not an automatic ChatGPT session certifier", async () => {
  const [page, panel] = await Promise.all([
    read("src/app/owner/context-bridge/page.tsx"),
    read("src/app/owner/context-bridge/ChatgptHandoffReviewPanel.tsx"),
  ]);
  assert.match(page, /requireOwnerAal2Page\("\/owner\/context-bridge"\)/);
  assert.match(page, /ChatgptHandoffReviewPanel/);
  assert.match(panel, /window\.confirm/);
  assert.match(panel, /confirm: true/);
  assert.match(panel, /\/api\/context-bridge\/chatgpt\/handoff-review/);
  assert.match(panel, /NO certifica/);
  assert.doesNotMatch(panel, /setInterval|autoRun|onMount.*POST/);
});
