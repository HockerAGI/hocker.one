import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";
const read = (file) => readFile(new URL("../" + file, import.meta.url), "utf8");
test("WebGPU candidate is never claimed as real inference", () => {
  const script = [
    "import { describeWebGpuPreflight as f, NOVA_BROWSER_MODEL_CANDIDATES as m } from './src/lib/nova-browser-inference-preflight.ts';",
    "console.log(JSON.stringify({models:m, cases:[f({secureContext:false,gpuApi:true,adapter:true}),f({secureContext:true,gpuApi:false,adapter:false}),f({secureContext:true,gpuApi:true,adapter:false}),f({secureContext:true,gpuApi:true,adapter:true})]}));",
  ].join("\n");
  const run=spawnSync(process.execPath,["--experimental-strip-types","--input-type=module","--eval",script],{cwd:new URL("../",import.meta.url),encoding:"utf8",timeout:10000});
  assert.equal(run.status,0,run.stderr);
  const output=JSON.parse(run.stdout.trim());
  assert.equal(output.models.length,2);
  assert.deepEqual(output.cases.map(c=>c.canAttempt),[false,false,false,true]);
  assert.equal(output.cases[3].reason,"HARDWARE_CANDIDATE_ONLY");
});
test("no third-party code executes inside owner session; browser data is not submitted to AI APIs",async()=>{
  const code=await read("src/components/NovaLocalPreflight.tsx");
  assert.match(code,/noopener noreferrer/);
  assert.match(code,/requestAdapter/);
  assert.doesNotMatch(code,/CreateMLCEngine|esm[.]run|@mlc-ai[/]web-llm|import\s*\(/);
  assert.doesNotMatch(code,/\/api\/nova\/chat|\/api\/agi\/runtime\/actions/);
});
test("status verification reuses protected read-only endpoint with existing cookies",async()=>{
  const code=await read("src/components/NovaLocalPreflight.tsx");
  assert.match(code,/fetch\("\/api\/nova\/zero-credit\/status"/);
  assert.match(code,/credentials: "same-origin"/);
  assert.doesNotMatch(code,/Bearer |x-hocker-owner-key|localStorage|sessionStorage/);
  const chat=await read("src/components/NovaRealtimeChat.tsx");
  assert.match(chat,/href="\/chat\/local"/);
  assert.match(chat,/shouldAllowActionDraft\(prompt\)/);
});

test("local preparation page itself is server-side role gated",async()=>{
  const code=await read("src/app/chat/local/page.tsx");
  assert.match(code,/await requireProjectRole\("hocker-one", \["owner", "admin", "operator", "viewer"\]\)/);
  assert.match(code,/redirect\("\/login"\)/);
});
