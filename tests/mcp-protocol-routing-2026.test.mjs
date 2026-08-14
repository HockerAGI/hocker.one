import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const client = await readFile(
  new URL("../src/lib/mcp/mcp-client.ts", import.meta.url),
  "utf8",
);

test("MCP 2026 routing names cover tools, prompts and resources", () => {
  assert.match(client, /method === "tools\/call"/);
  assert.match(client, /method === "prompts\/get"/);
  assert.match(client, /method === "resources\/read"/);
  assert.match(client, /params\?\.uri/);
  assert.match(client, /headers\["Mcp-Name"\]/);
});
