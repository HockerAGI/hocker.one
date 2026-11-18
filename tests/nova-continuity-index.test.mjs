import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("NOVA E2E operational index links live issue instead of stale September handoff", async () => {
  const [agents, index, recovery] = await Promise.all([
    read("AGENTS.md"), read("docs/operations/INDEX.md"), read("docs/operations/LAST_KNOWN_STATE.md"),
  ]);
  assert.match(agents, /docs\/operations\/INDEX\.md/);
  assert.match(index, /GitHub issue #306/);
  assert.match(index, /Historical September handoff/);
  assert.match(index, /OPEN PR #460/);
  assert.doesNotMatch(index, /The latest code milestone is the first Hocker Operating Loop contract slice/);
  assert.match(recovery, /issues\/306/);
  assert.match(recovery, /2026-11-18/);
  assert.match(recovery, /mandatory.*npm audit/);
  assert.match(recovery, /genuine NOVA\/AGI-origin PR/);
  assert.match(recovery, /Physical Node Agent is optional/);
});
