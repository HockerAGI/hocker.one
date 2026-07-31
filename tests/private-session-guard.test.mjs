import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(
  new URL("../src/lib/require-private-session.ts", import.meta.url),
  "utf8",
);

test("private session guard requires Hocker ONE membership", () => {
  assert.match(source, /from\("project_members"\)/);
  assert.match(source, /\.eq\("project_id", projectId\)/);
  assert.match(source, /\.eq\("user_id", data\.user\.id\)/);
  assert.match(source, /owner/);
  assert.match(source, /admin/);
  assert.match(source, /operator/);
  assert.match(source, /reason=forbidden/);
});
