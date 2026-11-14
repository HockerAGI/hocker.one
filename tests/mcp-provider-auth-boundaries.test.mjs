import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  trustedSupabaseMcpUrl, trustedOpenAIDocsMcpUrl, extractSupabaseProjectRef,
} from "../src/lib/mcp/mcp-provider-targets.ts";

const project = "yvuibbcuntqpyqiuqggd";
const url = `https://${project}.supabase.co`;

test("Supabase MCP strictly scopes to one official project and read-only feature groups", () => {
  assert.equal(extractSupabaseProjectRef(url), project);
  const result = new URL(trustedSupabaseMcpUrl({supabaseUrl:url,projectRef:project}));
  assert.equal(result.origin,"https://mcp.supabase.com");
  assert.equal(result.pathname,"/mcp");
  assert.equal(result.searchParams.get("project_ref"),project);
  assert.equal(result.searchParams.get("read_only"),"true");
  assert.equal(result.searchParams.get("features"),"database,debugging,docs");
  assert.equal(trustedSupabaseMcpUrl({supabaseUrl:url}),result.toString());
});

test("Supabase platform MCP PAT cannot leak to attacker-controlled or all-project URLs", () => {
  for(const target of [
    "https://evil.example/mcp","http://mcp.supabase.com/mcp",
    "https://mcp.supabase.com.evil.example/mcp",
    "https://mcp.supabase.com/mcp?read_only=false",
    "https://mcp.supabase.com/mcp?project_ref=another",
    "https://mcp.supabase.com/other",
    "https://user:pass@mcp.supabase.com/mcp",
    "https://mcp.supabase.com/mcp#foo",
  ]) {
    assert.throws(()=>trustedSupabaseMcpUrl({supabaseUrl:url,mcpServerUrl:target}),
      /SUPABASE_MCP_UNTRUSTED_ENDPOINT/,target);
  }
  assert.throws(()=>trustedSupabaseMcpUrl({
    supabaseUrl:url, projectRef:"zzzzzzzzzzzzzzzzzzzz",
  }),/SUPABASE_MCP_PROJECT_SCOPE_INVALID/);
  assert.throws(()=>trustedSupabaseMcpUrl({
    supabaseUrl:"https://example.com",projectRef:project,
  }),/SUPABASE_MCP_PROJECT_SCOPE_INVALID/);
  assert.throws(()=>trustedSupabaseMcpUrl({supabaseUrl:"",projectRef:project}),
    /SUPABASE_MCP_PROJECT_SCOPE_INVALID/);
});

test("OpenAI documentation connector permits only the public official Docs MCP URL",()=>{
  assert.equal(trustedOpenAIDocsMcpUrl(),"https://developers.openai.com/mcp");
  assert.equal(trustedOpenAIDocsMcpUrl("https://developers.openai.com/mcp"),"https://developers.openai.com/mcp");
  for(const target of [
    "https://api.openai.com/v1/mcp",
    "https://example.org/mcp",
    "https://developers.openai.com.evil.example/mcp",
    "http://developers.openai.com/mcp",
    "https://developers.openai.com/mcp?token=secret",
    "https://user:pass@developers.openai.com/mcp",
    "https://developers.openai.com/mcp#more",
  ]) assert.throws(()=>trustedOpenAIDocsMcpUrl(target),
    /OPENAI_DOCS_MCP_UNTRUSTED_ENDPOINT/,target);
});

test("MCP connectors do not send application API keys to admin/docs servers",async()=>{
  const [supabase,openai,registry,policy] = await Promise.all([
    readFile(new URL("../src/lib/mcp/mcp-supabase.ts",import.meta.url),"utf8"),
    readFile(new URL("../src/lib/mcp/mcp-openai.ts",import.meta.url),"utf8"),
    readFile(new URL("../src/lib/mcp/mcp-registry.ts",import.meta.url),"utf8"),
    readFile(new URL("../src/lib/mcp/mcp-policy.ts",import.meta.url),"utf8"),
  ]);
  assert.match(supabase,/accessToken: process\.env\.SUPABASE_MCP_ACCESS_TOKEN/);
  assert.match(supabase,/config\.accessToken/);
  assert.equal((supabase.match(/throw new Error\("SUPABASE_MCP_READ_ONLY"\)/g) ?? []).length,6);
  assert.doesNotMatch(supabase,/secretKey: process\.env|publishableKey: process\.env/);
  assert.doesNotMatch(supabase,/Authorization.*config\.secretKey/);
  assert.match(openai,/OPENAI_DOCS_MCP_ENABLED !== "true"/);
  assert.match(openai,/authHeaders: \{\}/);
  assert.doesNotMatch(openai,/process\.env\.OPENAI_API_KEY|api\.openai\.com\/v1\/mcp/);
  assert.match(registry,/SUPABASE_MCP_ACCESS_TOKEN/);
  assert.match(policy,/search_openai_docs\|lookup_page/);
});
