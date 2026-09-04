import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs/promises";

const read = (path) => fs.readFile(new URL("../"+path, import.meta.url), "utf8");

test("NOVA history route is owner-scoped and backed by canonical AGI session store", async () => {
  const route = await read("src/app/api/nova/history/route.ts");
  assert.match(route, /requireProjectRole/);
  assert.match(route, /agi_sessions/);
  assert.match(route, /user_id/);
  assert.match(route, /project_id/);
});

test("NOVA workspace exposes real history without introducing a second persistence store", async () => {
  const history = await read("src/components/NovaHistoryPanel.tsx");
  assert.match(history, /api\/nova\/history/);
  assert.match(history, /thread_id/);
  assert.match(history, /Open|Abrir/);
});
