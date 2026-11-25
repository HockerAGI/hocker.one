import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import ts from "typescript";
const source = await readFile(new URL("../src/lib/langfuse-safe.ts", import.meta.url),"utf8");
const compiled = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {getLangfuse}=await import("data:text/javascript;base64,"+Buffer.from(compiled).toString("base64"));
test("OTLP request-local complete observations, no sensitive payloads, no duplicate send",async()=>{
 const prevFetch=globalThis.fetch; const keys=["LANGFUSE_PUBLIC_KEY","LANGFUSE_SECRET_KEY","LANGFUSE_BASE_URL"];const previous=keys.map(k=>process.env[k]);
 try{
  process.env.LANGFUSE_PUBLIC_KEY="fixture-public";process.env.LANGFUSE_SECRET_KEY="fixture-secret";process.env.LANGFUSE_BASE_URL="https://example.invalid";
  const requests=[];globalThis.fetch=async(url,options)=>{requests.push({url:String(url),options});return new Response("{}",{status:200,headers:{"content-type":"application/json"}})};
  const client=getLangfuse();const a=client.trace({name:"Read",metadata:{endpoint:"/api/test",private:"do-not-send"}});const b=client.trace({name:"Second"});
  a.update({userId:"do-not-send"});a.event({name:"Failure",level:"ERROR",input:"do-not-send",output:"do-not-send"});
  await a.flushAsync();await a.flushAsync();
  assert.equal(requests.length,1);const req=requests[0];
  assert.equal(req.url,"https://example.invalid/api/public/otel/v1/traces");assert.equal(req.options.headers["x-langfuse-ingestion-version"],"4");assert.equal(req.options.redirect,"error");
  assert.doesNotMatch(req.options.body,/do-not-send|fixture-secret|Second/);
  const spans=JSON.parse(req.options.body).resourceSpans[0].scopeSpans[0].spans;
  assert.equal(spans.length,2);assert.equal(spans[1].parentSpanId,spans[0].spanId);assert.equal(spans[1].traceId,spans[0].traceId);assert.equal(spans[0].status.code,2);
  await b.flushAsync();assert.equal(requests.length,2);
  globalThis.fetch=async()=>{throw Error("network")};await assert.doesNotReject(client.trace({name:"Unavailable"}).flushAsync());
 }finally{globalThis.fetch=prevFetch;keys.forEach((k,i)=>previous[i]===undefined?delete process.env[k]:process.env[k]=previous[i]);}
});
