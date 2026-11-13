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
      CLOUDFLARE_ACCOUNT_ID:"",NOVA_CHAT_FREE_ONLY:""}
  });
  assert.equal(run.status,0,run.stderr);
  assert.deepEqual(JSON.parse(run.stdout.trim()),[false,false,false,false,false,true,true]);
});


test("chat-only free mode never reconfigures workers or engineering and search routes", () => {
  const script = [
    "import { novaChatFreeOnlyRequest as f, cloudflareFreeRouteConfigured as c } from './src/lib/cloudflare-zero-credit-policy.ts';",
    "const values=[f({project_id:'hocker-one',message:'Responde solo LISTO'})];",
    "process.env.NOVA_CHAT_FREE_ONLY='true';",
    "values.push(f({project_id:'hocker-one',message:'Responde solo LISTO'}));",
    "values.push(f({project_id:'other-app',message:'Responde solo LISTO'}));",
    "values.push(f({project_id:'hocker-one',message:'Corrige el repo en GitHub'}));",
    "values.push(f({project_id:'hocker-one',message:'Investiga fuentes recientes'}));",
    "values.push(f({project_id:'hocker-one',message:'Responde solo LISTO',allow_actions:true}));",
    "values.push(f({project_id:'hocker-one',message:'Responde solo LISTO',tools_requested:true}));",
    "values.push(f({project_id:'hocker-one',message:'List all Base44 apps'}));",
    "values.push(f({project_id:'hocker-one',message:'Responde con la lista de Base44 apps'}));",
    "values.push(c());"
    "process.env.CLOUDFLARE_WORKERS_AI_ENABLED='true';process.env.CLOUDFLARE_WORKERS_AI_FREE_PLAN_VERIFIED='true';process.env.CLOUDFLARE_ACCOUNT_ID='e53a864ed398f9d933c88b8a2c68c52b';process.env.CLOUDFLARE_WORKERS_AI_API_TOKEN='fixture';",
    "values.push(c());",
    "console.log(JSON.stringify(values));",
  ].join("\n");
  const run = spawnSync(process.execPath, ["--experimental-strip-types", "--input-type=module", "--eval", script], {
    cwd: new URL("../", import.meta.url), encoding: "utf8", timeout: 10000,
    env: {...process.env, AGI_ZERO_CREDIT_ONLY: "", NOVA_CHAT_FREE_ONLY: "",
      CLOUDFLARE_WORKERS_AI_ENABLED: "", CLOUDFLARE_WORKERS_AI_FREE_PLAN_VERIFIED: "",
      CLOUDFLARE_ACCOUNT_ID: "", CLOUDFLARE_WORKERS_AI_API_TOKEN: ""},
  });
  assert.equal(run.status, 0, run.stderr);
  assert.deepEqual(JSON.parse(run.stdout.trim()), [false,true,false,false,false,false,false,false,false,false,true]);
});

test("scoped chat cannot change AGI provider defaults or enable model tools", async () => {
  const router = await read("src/lib/agi-model-router.ts");
  const runtime = await read("src/lib/unified-nova-chat-runtime.ts");
  const provider = await read("src/lib/agi-model-providers/cloudflare-workers-ai.ts");
  assert.match(router, /if \(freeOnly\) return \["cloudflare-workers-ai"\]/);
  assert.match(router, /function routeOrder\(freeOnly = false\)/);
  assert.match(router, /value !== "cloudflare-workers-ai"/);
  assert.match(runtime, /freeOnlyChat \? \[\] : await buildAgiNativeMcpTools/);
  assert.match(runtime, /freeOnlyChat \? Promise.resolve\(""\) : buildAgiMcpPromptBlock/);
  assert.match(runtime, /const resolvedCalls = freeOnlyChat \? \[\]/);
  assert.match(runtime, /free_only: freeOnlyChat/);
  assert.match(provider, /input.tools\?\.length/);
  assert.match(runtime, /scoped_cloudflare_free_only: freeOnlyChat/);
  assert.match(runtime, /tools_requested: Boolean\(params.tools_requested\?\.length\)/);
});

test("both NOVA API variants fail closed for simple scoped-free chat", async () => {
  const direct = await read("src/app/api/nova/chat/route.ts");
  const stream = await read("src/app/api/nova/chat/stream/route.ts");
  for (const src of [direct, stream]) {
    assert.match(src,/cloudflareZeroCreditMode\(\) \|\| novaChatFreeOnlyRequest/);
    assert.match(src,/no paid fallback executed/);
    assert.match(src,/requireProjectRole/);
  }
});

test("explicit zero-credit mode cannot fall back to Vercel, Gemini, Anthropic or OpenAI", async () => {
  const router=await read("src/lib/agi-model-router.ts");
  assert.match(router,/if \(cloudflareZeroCreditMode\(\)\) return \["cloudflare-workers-ai"\]/);
  assert.match(router,/CLOUDFLARE_FREE_WEB_SEARCH_UNAVAILABLE/);
  assert.match(router,/"cloudflare-workers-ai": cloudflareWorkersAiProvider/);
});


test("streaming chat cannot fall back to uncertified dedicated runtime in strict free-only mode", async () => {
  const stream = await read("src/app/api/nova/chat/stream/route.ts");
  const gate = stream.indexOf("if (cloudflareZeroCreditMode() || novaChatFreeOnlyRequest(");
  const fallback = stream.indexOf("const upstream = await fetch(");
  const local = stream.indexOf("await runToolEnabledUnifiedNovaChat(");
  assert.ok(local >= 0 && gate > local && fallback > gate, "strict gate must follow local inference and precede fallback");
  assert.match(stream.slice(gate, fallback), /no paid fallback executed/);
  assert.match(stream.slice(gate, fallback), /allow_actions: false, tools_requested: parsed.data.tools_requested.length > 0/);
  assert.match(stream.slice(gate, fallback), /sse\("done", \{ ok: false \}\)/);
  assert.match(stream, /allow_actions: false/);
});

test("dedicated runtime health does not incorrectly disable the unified NOVA composer", async () => {
  const ui = await read("src/components/NovaRealtimeChat.tsx");
  assert.match(ui, /Runtime dedicado sin señal/);
  assert.doesNotMatch(ui, /NOVA está sin conexión/);
  assert.match(ui, /placeholder="Escribe a NOVA…"/);
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
