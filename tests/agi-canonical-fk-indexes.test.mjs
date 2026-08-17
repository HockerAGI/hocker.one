import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const migrationPath = "supabase/migrations/20260817052915_agi_canonical_fk_indexes.sql";

test("canonical AGI foreign keys have dedicated leading indexes without destructive DDL", async () => {
  const sql = await read(migrationPath);

  for (const [indexName, tableName] of [
    ["agi_agents_agi_id_idx", "agi_agents"],
    ["agi_agent_tools_agi_id_idx", "agi_agent_tools"],
    ["agi_memory_mirror_agi_id_idx", "agi_memory_mirror"],
  ]) {
    assert.match(
      sql,
      new RegExp(`create\\s+index\\s+if\\s+not\\s+exists\\s+${indexName}\\s+on\\s+public\\.${tableName}\\s*\\(agi_id\\)`, "i"),
    );
  }

  assert.doesNotMatch(sql, /\bdrop\s+(index|table|constraint)\b/i);
  assert.doesNotMatch(sql, /\bgrant\b|\brevoke\b|\bcreate\s+policy\b|\balter\s+policy\b/i);
});
