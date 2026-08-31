import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("NOVA workspace mounts a canonical capability contract and derives visible actions", async () => {
  const [lazy, picker] = await Promise.all([
    readFile(new URL("../src/components/NovaRealtimeChatLazy.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/NovaWorkspaceCapabilities.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(lazy, /NovaWorkspaceCapabilities/);
  assert.match(lazy, /nova-workspace-capabilities|NovaWorkspaceCapabilities/);
  assert.match(picker, /getVisibleNovaCapabilities\(/);
  assert.doesNotMatch(picker, /NATIVE_CAPABILITIES\s*=\s*\[/);
});

test("NOVA chat keeps ordinary streaming action execution disabled by default", async () => {
  const source = await readFile(
    new URL("../src/components/NovaRealtimeChat.tsx", import.meta.url),
    "utf8",
  );

  assert.match(
    source,
    /allow_actions:\s*false/,
    "normal NOVA streaming must keep action execution disabled by default",
  );
});
