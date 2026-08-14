import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Owner Gate recognizes CHIDO Lab and CHIDO Games repositories", async () => {
  const policy = await read("src/lib/mcp/mcp-policy.ts");

  assert.match(policy, /HockerAGI\/chido\.lab/);
  assert.match(policy, /HockerAGI\/chido\.games/);
});
