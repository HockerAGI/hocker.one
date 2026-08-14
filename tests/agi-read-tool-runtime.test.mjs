import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("tool eval route accepts only one AGI and one supported tool under Owner AAL2", async () => {
  const route = await read("src/app/api/agi/tools/eval/route.ts");

  assert.match(route, /requireOwnerAal2Api/);
  assert.match(route, /agi_id/);
  assert.match(route, /tool_key/);
  assert.match(route, /\.strict\(\)/);
  assert.doesNotMatch(route, /\b(operation|query|sql|repository|path|args)\s*:/);
  assert.doesNotMatch(route, /tool_keys|run_all|Promise\.all/);
  assert.match(route, /runAgiReadOnlyToolProbe/);
});

test("tool runtime validates the effective assignment and executor-ready policy before probing", async () => {
  const source = await read("src/lib/agi-read-tool-runtime.ts");

  assert.match(source, /from\("agi_agent_tools"\)/);
  assert.match(source, /\.eq\("project_id", projectId\)/);
  assert.match(source, /\.eq\("agi_id", agiId\)/);
  assert.match(source, /\.eq\("tool_key", toolKey\)/);
  assert.match(source, /\.eq\("enabled", true\)/);
  assert.match(source, /normalized_status/);
  assert.match(source, /implementation_status/);
  assert.match(source, /execution_enabled/);
});

test("first tool runtime slice supports only hard-coded Supabase and GitHub reads", async () => {
  const source = await read("src/lib/agi-read-tool-runtime.ts");

  assert.match(source, /SUPPORTED_READ_TOOL_KEYS/);
  assert.match(source, /"supabase"/);
  assert.match(source, /"github"/);
  assert.match(source, /AI_GATEWAY_ALREADY_COVERED_BY_AGI_EVAL/);
  assert.match(source, /executeGitHubReadOperation\("get_repo"/);
  assert.match(source, /repository:\s*"HockerAGI\/hocker\.one"/);
  assert.match(source, /from\("agi_agents"\)/);
  assert.doesNotMatch(source, /executeQuery|execute_sql|create_branch|upsert_file|create_pr/);
});

test("tool probe writes only versioned read-only evidence with no secrets or raw payload", async () => {
  const source = await read("src/lib/agi-read-tool-runtime.ts");

  assert.match(source, /feedback_type:\s*"agi_tool_eval_result"/);
  assert.match(source, /tool_eval_version:\s*AGI_TOOL_EVAL_VERSION/);
  assert.match(source, /mode:\s*"read_only"/);
  assert.match(source, /external_writes_executed:\s*false/);
  assert.match(source, /evidence_ref/);
  assert.match(source, /createHash/);
  assert.doesNotMatch(source, /token|secret|authorization/i);
});

test("tool probe response is bounded and does not return provider raw data", async () => {
  const source = await read("src/lib/agi-read-tool-runtime.ts");

  assert.match(source, /summary/);
  assert.match(source, /checked_at/);
  assert.doesNotMatch(source, /raw_result|provider_payload|content:/);
});
