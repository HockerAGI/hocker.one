import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("remote MCP providers use their current official endpoints", async () => {
  const [vercel, github] = await Promise.all([
    read("src/lib/mcp/mcp-vercel.ts"),
    read("src/lib/mcp/mcp-github.ts"),
  ]);

  assert.match(vercel, /https:\/\/mcp\.vercel\.com/);
  assert.doesNotMatch(vercel, /api\.vercel\.com\/v1\/mcp/);

  assert.match(github, /https:\/\/api\.githubcopilot\.com\/mcp\//);
  assert.doesNotMatch(github, /https:\/\/api\.github\.com\/mcp/);
});

test("Vercel REST tokens are not silently treated as MCP OAuth credentials", async () => {
  const [vercel, env] = await Promise.all([
    read("src/lib/mcp/mcp-vercel.ts"),
    read("env.example"),
  ]);

  assert.match(vercel, /VERCEL_MCP_AUTH_TOKEN/);
  assert.doesNotMatch(vercel, /vercelToken:\s*process\.env\.VERCEL_TOKEN/);
  assert.match(vercel, /isVercelMcpConfigured[\s\S]*VERCEL_MCP_AUTH_TOKEN/);
  assert.match(env, /VERCEL_TOKEN=.*REST/i);
  assert.match(env, /VERCEL_MCP_AUTH_TOKEN=/);
});

test("OpenAI API credentials are never repurposed as arbitrary MCP server credentials", async () => {
  const [openai, env] = await Promise.all([
    read("src/lib/mcp/mcp-openai.ts"),
    read("env.example"),
  ]);

  assert.doesNotMatch(openai, /https:\/\/api\.openai\.com\/v1\/mcp/);
  assert.doesNotMatch(openai, /apiKey:\s*process\.env\.OPENAI_API_KEY/);
  assert.match(openai, /OPENAI_MCP_AUTH_TOKEN/);
  assert.match(openai, /OPENAI_MCP_URL/);
  assert.match(openai, /isOpenAIMcpConfigured[\s\S]*OPENAI_MCP_URL[\s\S]*OPENAI_MCP_AUTH_TOKEN/);

  assert.match(env, /OPENAI_API_KEY=.*OpenAI API/i);
  assert.match(env, /OPENAI_MCP_URL=/);
  assert.match(env, /OPENAI_MCP_AUTH_TOKEN=/);
});

test("modern MCP 404 negotiates down to the latest initialize-era protocol", async () => {
  const client = await read("src/lib/mcp/mcp-client.ts");

  assert.match(client, /response\.status === 404/);
  assert.match(client, /LEGACY_PROTOCOL_VERSION\s*=\s*"2025-11-25"/);
  assert.match(client, /MCP-Session-Id/);
  assert.match(client, /notifications\/initialized/);
  assert.match(client, /MCP-Protocol-Version/);
});

test("Streamable HTTP request responses support both JSON and SSE", async () => {
  const client = await read("src/lib/mcp/mcp-client.ts");

  assert.match(client, /text\/event-stream/);
  assert.match(client, /content-type/i);
  assert.match(client, /parseSse/);
  assert.match(client, /data:/);
  assert.match(client, /mcpRequest\.id/);
});
