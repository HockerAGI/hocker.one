import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("project-role boundary maps invalid project ids to HTTP 400", async () => {
  const source = await read("src/app/api/_lib.ts");

  assert.match(source, /function requireProjectRole[\s\S]*?try \{[\s\S]*?normalizeProjectId\(project_id\)/);
  assert.match(source, /throw new ApiError\(400, \{ error: getErrorMessage\(err\) \}\)/);
});
