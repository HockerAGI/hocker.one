import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("NOVA chat consumes a canonical capability contract", async () => {
  const source = await readFile(
    new URL("../src/components/NovaRealtimeChat.tsx", import.meta.url),
    "utf8",
  );

  assert.match(
    source,
    /nova-workspace-capabilities/,
    "NOVA chat must consume the canonical workspace capability contract",
  );
  assert.match(
    source,
    /getVisibleNovaCapabilities\(/,
    "NOVA chat must derive visible capabilities from the canonical contract",
  );
  assert.doesNotMatch(
    source,
    /NATIVE_CAPABILITIES\s*=\s*\[/,
    "capabilities must not remain hard-coded inside the monolithic chat component",
  );
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
