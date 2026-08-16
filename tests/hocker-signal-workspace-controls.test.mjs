import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Ajustes preserves workspace controls removed from the old persistent WorkspaceBar", async () => {
  const page = await read("src/app/app/ajustes/page.tsx");
  const controls = await read("src/components/WorkspaceControlsCard.tsx");

  assert.match(page, /WorkspaceControlsCard/);
  assert.match(controls, /useWorkspace/);
  assert.match(controls, /toggleTutorial/);
  assert.match(controls, /resetWorkspace/);
  assert.match(controls, /projectId/);
  assert.match(controls, /nodeId/);
  assert.match(controls, /Gu[ií]a/);
  assert.match(controls, /Restablecer workspace/);
});
