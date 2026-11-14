import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import worker, { observe, safeCoordinatorErrorCode } from "../infra/cloudflare/nova-coordinator/index.mjs";

const token = "r".repeat(48);
const bypass = "b".repeat(32);
const good = {
  ok: true, service: "hocker-one", coordinator_mode: "observe_only",
  project_id: "hocker-one",
  owner_gate_bypassed: false, material_actions_executed: 0, model_requests: 0,
  metrics: {
    registered_agi_profiles: 16, queued_agi_tasks: 14,
    blocked_or_pending_material_actions: 0, fresh_dedicated_nodes: 0,
  },
};
const okResponse = (body=good) => new Response(JSON.stringify(body),{
  status: 200, headers: {"content-type":"application/json"},
});

test("disabled coordinator makes no calls or model/provider requests", async()=>{
  let calls = 0;
  assert.deepEqual(await observe({}, ()=>{calls++;}), {ok:false,code:"COORDINATOR_DISABLED"});
  assert.equal(calls,0);
  await worker.scheduled({cron:"*/5 * * * *"}, {NOVA_COORDINATOR_ENABLED:"false"});
  assert.equal(calls,0);
});

test("one GET to fixed Hocker One origin, with scoped token and no payload", async()=>{
  let n=0;
  const result = await observe({
    NOVA_COORDINATOR_ENABLED:"true",NOVA_COORDINATOR_READ_TOKEN:token,
    NOVA_COORDINATOR_VERCEL_BYPASS_TOKEN:bypass,
  },async (url,init)=>{
    n++; assert.equal(url,"https://hockerone.vercel.app/api/internal/nova-coordinator");
    assert.equal(init.method,"GET");
    assert.equal(init.headers.Authorization,"Bearer "+token);
    assert.equal(init.headers["x-vercel-protection-bypass"],bypass);
    assert.equal(init.redirect,"manual");
    assert.equal(init.body,undefined);
    return okResponse();
  });
  assert.equal(n,1);
  assert.equal(result.ok,true);
  assert.equal(result.registered_agi_profiles,16);
  assert.equal(result.queued_agi_tasks,14);
  assert.equal(JSON.stringify(result).includes(token),false);
  assert.equal(JSON.stringify(result).includes(bypass),false);
});

test("rejects invalid auth, redirects, leaks and unauthenticated output",async()=>{
  await assert.rejects(observe({NOVA_COORDINATOR_ENABLED:"true"},()=>okResponse()),
    /COORDINATOR_SECRET_MISSING/);
  // A missing project-wide deployment bypass must never silently fall back
  // to a public URL or a broader HOCKER token.
  await assert.rejects(observe({NOVA_COORDINATOR_ENABLED:"true",NOVA_COORDINATOR_READ_TOKEN:token},
    ()=>okResponse()),/COORDINATOR_VERCEL_BYPASS_MISSING/);
  await assert.rejects(observe({NOVA_COORDINATOR_ENABLED:"true",NOVA_COORDINATOR_READ_TOKEN:token,
    NOVA_COORDINATOR_VERCEL_BYPASS_TOKEN:"not-valid"},
    ()=>okResponse()),/COORDINATOR_VERCEL_BYPASS_MISSING/);
  await assert.rejects(observe({
    NOVA_COORDINATOR_ENABLED:"true",NOVA_COORDINATOR_READ_TOKEN:token,
    NOVA_COORDINATOR_VERCEL_BYPASS_TOKEN:bypass,
  },()=>new Response("",{status:401})),/COORDINATOR_UPSTREAM_HTTP_401/);
  await assert.rejects(observe({
    NOVA_COORDINATOR_ENABLED:"true",NOVA_COORDINATOR_READ_TOKEN:token,
    NOVA_COORDINATOR_VERCEL_BYPASS_TOKEN:bypass,
  },()=>okResponse({...good,model_requests:1})),/COORDINATOR_RESPONSE_CONTRACT_INVALID/);
  await assert.rejects(observe({
    NOVA_COORDINATOR_ENABLED:"true",NOVA_COORDINATOR_READ_TOKEN:token,
    NOVA_COORDINATOR_VERCEL_BYPASS_TOKEN:bypass,
  },()=>okResponse({...good,owner_gate_bypassed:true})),/COORDINATOR_RESPONSE_CONTRACT_INVALID/);
});

test("protected Vercel redirects fail closed and are not followed",async()=>{
  let calls=0;
  await assert.rejects(observe({
    NOVA_COORDINATOR_ENABLED:"true",NOVA_COORDINATOR_READ_TOKEN:token,
    NOVA_COORDINATOR_VERCEL_BYPASS_TOKEN:bypass,
  },async (_url,init)=>{
    calls++;
    assert.equal(init.redirect,"manual");
    return new Response(null,{status:302,headers:{Location:"https://untrusted.example/redirect"}});
  }),/COORDINATOR_UPSTREAM_HTTP_302/);
  assert.equal(calls,1);
});

test("diagnostics map errors to fixed codes without exposing secrets",()=>{
  const redirect=new TypeError("redirect blocked: "+token+" "+bypass);
  const network=new TypeError("DNS fetch failed for secret "+bypass);
  assert.equal(safeCoordinatorErrorCode(redirect),"COORDINATOR_FETCH_REDIRECT_ERROR");
  assert.equal(safeCoordinatorErrorCode(network),"COORDINATOR_FETCH_NETWORK_ERROR");
  assert.equal(safeCoordinatorErrorCode(new TypeError("unknown "+token)),"COORDINATOR_FETCH_TYPE_ERROR");
  const abort=new Error("Abort error "+token);
  abort.name="AbortError";
  assert.equal(safeCoordinatorErrorCode(abort),"COORDINATOR_FETCH_TIMEOUT");
  for(const err of [redirect,network,new TypeError("unknown "+token),abort]){
    const out=safeCoordinatorErrorCode(err);
    assert.equal(out.includes(token),false);
    assert.equal(out.includes(bypass),false);
  }
});

test("public Worker only provides minimal health; routes do not execute tools",async()=>{
  const health = await worker.fetch(new Request("https://test.example/health"));
  assert.equal(health.status,200);
  const body = await health.json();
  assert.equal(body.task_executor,false);
  assert.equal(body.dedicated_runtime,false);
  assert.equal((await worker.fetch(new Request("https://test.example/execute"))).status,404);
  const route = await readFile(new URL("../src/app/api/internal/nova-coordinator/route.ts",import.meta.url),"utf8");
  const config = await readFile(new URL("../infra/cloudflare/nova-coordinator/wrangler.toml",import.meta.url),"utf8");
  assert.match(route,/NOVA_COORDINATOR_READ_TOKEN/);
  assert.match(route,/NOVA_COORDINATOR_OBSERVE_ENABLED !== "true"/);
  assert.match(route,/timingSafeEqual/);
  assert.match(route,/from\("agi_agents"\)\.select\("agi_id", \{ head: true, count: "exact" \}\)/);
  assert.doesNotMatch(route,/from\("agi_agents"\)\.select\("id"/);
  assert.match(route,/from\("agi_tasks"\)\.select\("id", \{ head: true, count: "exact" \}\)/);
  assert.doesNotMatch(route,/\.insert\(|\.update\(|\.delete\(|\.upsert\(|\.rpc\(|executeCommand\(|runUnifiedAgiWorkerOnce\(/);
  assert.match(config,/NOVA_COORDINATOR_ENABLED = "false"/);
  assert.doesNotMatch(config,/^crons\s*=/m);
});
