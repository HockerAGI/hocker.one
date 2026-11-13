import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (file) => readFile(new URL("../" + file, import.meta.url), "utf8");

test("free-only route remains unconfigured unless all independent flags and exact account match", () => {
  const script = [
    "import { cloudflareFreeRouteConfigured as f, cloudflareZeroCreditMode as z } from './src/lib/cloudflare-zero-credit-policy.ts';",
    "const results=[f()];",
    "process.env.AGI_ZERO_CREDIT_ONLY='true';results.push(f());",
    "process.env.CLOUDFLARE_WORKERS_AI_ENABLED='true';results.push(f());",
    "process.env.CLOUDFLARE_WORKERS_AI_FREE_PLAN_VERIFIED='true';results.push(f());",
    "process.env.CLOUDFLARE_WORKERS_AI_API_TOKEN='test';process.env.CLOUDFLARE_ACCOUNT_ID='other';results.push(f());",
    "process.env.CLOUDFLARE_ACCOUNT_ID='e53a864ed398f9d933c88b8a2c68c52b';results.push(f(),z());",
    "console.log(JSON.stringify(results));",
  ].join("\n");
  const run=spawnSync(process.execPath,["--experimental-strip-types","--input-type=module","--eval",script],{
    cwd:new URL("../",import.meta.url),encoding:"utf8",timeout:10000,
    env:{...process.env,AGI_ZERO_CREDIT_ONLY:"",CLOUDFLARE_WORKERS_AI_ENABLED:"",
      CLOUDFLARE_WORKERS_AI_FREE_PLAN_VERIFIED:"",CLOUDFLARE_WORKERS_AI_API_TOKEN:"",
      CLOUDFLARE_ACCOUNT_ID:""}
  });
  assert.equal(run.status,0,run.stderr);
  assert.deepEqual(JSON.parse(run.stdout.trim()),[false,false,false,false,false,true,true]);
});

test("explicit zero-credit mode cannot fall back to Vercel, Gemini, Anthropic or OpenAI", async () => {
  const router=await read("src/lib/agi-model-router.ts");
  assert.match(router,/if \(cloudflareZeroCreditMode\(\)\) return \["cloudflare-workers-ai"\]/);
  assert.match(router,/CLOUDFLARE_FREE_WEB_SEARCH_UNAVAILABLE/);
  assert.match(router,/"cloudflare-workers-ai": cloudflareWorkersAiProvider/);
});


test("streaming chat cannot fall back to uncertified dedicated runtime in strict free-only mode", async () => {
  const stream = await read("src/app/api/nova/chat/stream/route.ts");
  const gate = stream.indexOf("if (cloudflareZeroCreditMode())");
  const fallback = stream.indexOf("const upstream = await fetch(");
  const local = stream.indexOf("await runToolEnabledUnifiedNovaChat(");
  assert.ok(local >= 0 && gate > local && fallback > gate, "strict gate must follow local inference and precede fallback");
  assert.match(stream.slice(gate, fallback), /no paid fallback executed/);
  assert.match(stream.slice(gate, fallback), /sse\("done", \{ ok: false \}\)/);
  assert.match(stream, /allow_actions: false/);
});

test("native model call is bounded, request logs off, one attempt, no paid models or model tool execution", async () => {
  const provider=await read("src/lib/agi-model-providers/cloudflare-workers-ai.ts");
  const policy=await read("src/lib/cloudflare-zero-credit-policy.ts");
  assert.match(policy,/CF_FREE_MODEL = "@cf\/zai-org\/glm-4\.7-flash"/);
  assert.match(policy,/CF_MAX_OUTPUT_TOKENS = 384/);
  assert.match(policy,/CLOUDFLARE_WORKERS_AI_FREE_PLAN_VERIFIED/);
  assert.match(provider,/"cf-aig-collect-log": "false"/);
  assert.match(provider,/"cf-aig-max-attempts": "1"/);
  assert.match(provider,/"cf-aig-skip-cache": "true"/);
  assert.match(provider,/fallback_eligible: false/);
  assert.match(provider,/tool_calls: \[\]/);
  assert.match(provider,/CF_MAX_INPUT_CHARS/);
  assert.match(provider,/chat_template_kwargs: \{ enable_thinking: false \}/);
  assert.match(provider,/CLOUDFLARE_EMPTY_RESPONSE/);
  assert.doesNotMatch(provider,/executeAgiMcpToolCalls|\/api\/chat|\.rpc\(|\.insert\(/);
});
