import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("node mirror liveness is derived only from the node heartbeat timestamp", async () => {
  const source = await read("src/lib/hocker-node-mirror-summary.ts");

  assert.match(source, /\.from\("nodes"\)[\s\S]*\.select\("node_id,last_seen_at"\)/);
  assert.match(source, /const lastSeenAt = asString\(node\?\.last_seen_at\)/);
  assert.doesNotMatch(
    source,
    /const lastSeenAt = newestDate\([\s\S]*latestCommand[\s\S]*latestEvent/,
  );
  assert.match(source, /function isRecent\(value: string \| null, minutes = 5\)/);
});
