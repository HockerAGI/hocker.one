import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("serverless runtime keeps Supabase and RPC boundaries explicit", async () => {
  const source = await read("src/lib/serverless-agi-runtime.ts");

  assert.match(source, /ReturnType<typeof createAdminSupabase>/);
  assert.match(source, /type NarrowRpcClient/);
  assert.match(source, /rpc<T>\(functionName: string, args: JsonRecord\)/);
  assert.doesNotMatch(source, /SupabaseClient<any/);
  assert.doesNotMatch(source, /:\s*any\b/);
});
