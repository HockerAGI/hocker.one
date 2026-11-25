import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read = p => readFile(new URL("../" + p, import.meta.url), "utf8");
test("operations isolates failed sources and does not invent zero or offline", async () => {
  const page = await read("src/app/live/page.tsx");
  assert.match(page, /await requirePrivateSession\(\)/);
  assert.match(page, /Promise\.allSettled/);
  assert.match(page, /!summary \? "unknown"/);
  assert.match(page, /databaseVerified && operational \? operational\.metrics\.pending_actions : "—"/);
  assert.match(page, /<LiveSessionSignals projectId="hocker-one" \/>/);
  assert.match(page, /<RefreshDataButton \/>/);
});
test("fallback only reads project-scoped data using the authenticated session", async () => {
  const panel = await read("src/components/live/LiveSessionSignals.tsx");
  assert.match(panel, /await requirePrivateSession\(projectId\)/);
  assert.match(panel, /await createServerSupabase\(\)/);
  assert.equal((panel.match(/\.eq\("project_id", projectId\)/g) || []).length, 3);
  assert.doesNotMatch(panel, /createAdminSupabase|\.insert\(|\.update\(|\.delete\(|\.upsert\(/);
  assert.match(panel, /Consulta sin verificar/);
});
