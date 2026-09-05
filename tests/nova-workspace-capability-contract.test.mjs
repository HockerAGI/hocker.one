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
  assert.match(picker, /fillNovaComposer\(/);
  assert.match(picker, /textarea\[aria-label="Mensaje para NOVA"\]/);
  assert.doesNotMatch(picker, /NATIVE_CAPABILITIES\s*=\s*\[/);
});

test("NOVA workspace never turns pending or blocked capabilities into actionable buttons", async () => {
  const source = await readFile(
    new URL("../src/components/NovaWorkspaceCapabilities.tsx", import.meta.url),
    "utf8",
  );

  assert.match(source, /status === "active" \|\| item\.status === "protected"/);
  assert.match(source, /En preparación/);
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


test("NOVA workspace mounts the canonical MCP tools panel without a second registry", async () => {
  const [lazy, toolsPanel, route] = await Promise.all([
    readFile(new URL("../src/components/NovaRealtimeChatLazy.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/NovaWorkspaceTools.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/api/mcp/status/route.ts", import.meta.url), "utf8"),
  ]);
  assert.match(lazy, /NovaWorkspaceTools/);
  assert.match(toolsPanel, /fetch\("\/api\/mcp\/status"/);
  assert.match(toolsPanel, /MCP Registry/);
  assert.match(toolsPanel, /Owner Gate/);
  assert.match(route, /requireOwnerOrInternal/);
});


test("NOVA workspace mounts the guarded GitHub repository workspace", async () => {
  const [lazy, workspace, route] = await Promise.all([
    readFile(new URL("../src/components/NovaRealtimeChatLazy.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/NovaRepositoryWorkspace.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/api/agi/runtime/github/route.ts", import.meta.url), "utf8"),
  ]);
  assert.match(lazy, /NovaRepositoryWorkspace/);
  assert.match(workspace, /\/api\/agi\/runtime\/github/);
  assert.match(workspace, /Lectura real desde GitHub/);
  assert.match(workspace, /Escritura: Owner Gate/);
  assert.match(route, /requireProjectRole/);
  assert.match(route, /isGitHubReadOperation/);
  assert.match(route, /enqueueAgiAction/);
});


test("NOVA workspace mounts the canonical task operations console", async () => {
  const [lazy, tasks, workerRoute] = await Promise.all([
    readFile(new URL("../src/components/NovaRealtimeChatLazy.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/components/NovaWorkspaceTasks.tsx", import.meta.url), "utf8"),
    readFile(new URL("../src/app/api/agi/workers/route.ts", import.meta.url), "utf8"),
  ]);
  assert.match(lazy, /NovaWorkspaceTasks/);
  assert.match(tasks, /VerifiableWorkersConsole/);
  assert.match(tasks, /Cola AGI canónica/);
  assert.match(workerRoute, /createServerlessAgiTask/);
  assert.match(workerRoute, /runUnifiedAgiWorkerOnce/);
  assert.match(workerRoute, /recoverStaleServerlessAgiTasks/);
});
