import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("GitHub remote MCP uses GitHub-owned read-only endpoint with no arbitrary token egress", async () => {
  const connector = await read("src/lib/mcp/mcp-github.ts");
  assert.match(connector, /https:\/\/api\.githubcopilot\.com\/mcp\/readonly/);
  assert.doesNotMatch(connector, /https:\/\/api\.github\.com\/mcp"/);
  assert.match(connector, /GITHUB_MCP_URL_NOT_TRUSTED_READ_ONLY/);
  assert.match(connector, /url\.origin !== "https:\/\/api\.githubcopilot\.com"/);
  assert.match(connector, /"X-MCP-Readonly": "true"/);
  assert.match(connector, /config\.githubToken/);
});

test("Vercel REST bearer is never mistaken for the separately authorized OAuth MCP token", async () => {
  const connector = await read("src/lib/mcp/mcp-vercel.ts");
  assert.match(connector, /https:\/\/mcp\.vercel\.com/);
  assert.match(connector, /oauthAccessToken: process\.env\.VERCEL_MCP_OAUTH_TOKEN/);
  assert.match(connector, /Boolean\(process\.env\.VERCEL_MCP_OAUTH_TOKEN\)/);
  assert.match(connector, /config\.oauthAccessToken/);
  assert.doesNotMatch(connector, /VERCEL_API_BASE|\/v1\/mcp|config\.vercelToken/);
});

test("MCP client parses bounded SSE JSON-RPC replies after modern negotiation fallback", () => {
  const code = [
    "import { McpClient } from './src/lib/mcp/mcp-client.ts';",
    "const seen = [];",
    "globalThis.fetch = async (url,opts) => {",
    "  const req = JSON.parse(opts.body); seen.push(req.method);",
    "  if (req.method==='server/discover') return new Response('',{status:400});",
    "  const result = req.method==='initialize' ? {capabilities:{tools:{}},serverInfo:{version:'test'}} : {tools:[{name:'get_file_contents'}]};",
    "  const frame=JSON.stringify({jsonrpc:'2.0',id:req.id,result});",
    "  return new Response('event: message\\ndata: '+frame+'\\n\\n',{status:200,headers:{'Content-Type':'text/event-stream'}});",
    "};",
    "const client=new McpClient({id:'github',name:'fixture',type:'github',url:'https://api.githubcopilot.com/mcp/readonly'});",
    "const init=await client.initialize(); const tools=await client.listTools();",
    "console.log(JSON.stringify({seen,init,toolNames:tools.map(t=>t.name)}));",
  ].join("\n");
  const r = spawnSync(process.execPath, ["--experimental-strip-types","--input-type=module","--eval",code], {
    cwd: new URL("../", import.meta.url), encoding:"utf8",timeout:12000,
  });
  assert.equal(r.status,0,r.stderr);
  const output=JSON.parse(r.stdout.trim());
  assert.deepEqual(output.seen,["server/discover","initialize","tools/list"]);
  assert.deepEqual(output.toolNames,["get_file_contents"]);
  assert.ok(output.init.capabilities.includes("tools"));
});

test("MCP client rejects a response using a nonmatching JSON-RPC request ID", async () => {
  const client=await read("src/lib/mcp/mcp-client.ts");
  assert.match(client, /MCP_RESPONSE_ID_MISMATCH/);
  assert.match(client, /MCP_SSE_RESPONSE_ID_MISSING/);
  assert.match(client, /MCP_SSE_RESPONSE_TOO_LARGE/);
  assert.match(client, /String\(event\.id\) === requestId/);
});
