import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("MCP client prefers the 2026-07-28 stateless protocol with explicit routing metadata", async () => {
  const client = await read("src/lib/mcp/mcp-client.ts");

  assert.match(client, /2026-07-28/);
  assert.match(client, /server\/discover/);
  assert.match(client, /MCP-Protocol-Version/);
  assert.match(client, /Mcp-Method/);
  assert.match(client, /Mcp-Name/);
  assert.match(client, /io\.modelcontextprotocol\/clientInfo/);
  assert.match(client, /io\.modelcontextprotocol\/protocolVersion/);
});

test("MCP client preserves an explicit current initialize-era fallback", async () => {
  const client = await read("src/lib/mcp/mcp-client.ts");

  assert.match(client, /2025-11-25/);
  assert.match(client, /legacy/i);
  assert.match(client, /initialize/);
  assert.match(client, /notifications\/initialized/);
  assert.match(client, /MCP-Session-Id/);
});
