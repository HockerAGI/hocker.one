import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const PRIVATE_CHIDO_REPOS = ["HockerAGI/chido.lab", "HockerAGI/chido.games"];

test("Owner Gate code and operations documentation recognize private CHIDO repositories", async () => {
  const [policy, runbook] = await Promise.all([
    read("src/lib/mcp/mcp-policy.ts"),
    read("docs/operations/GITHUB_OWNER_GATE.md"),
  ]);

  for (const repository of PRIVATE_CHIDO_REPOS) {
    const escaped = repository.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.match(policy, new RegExp(escaped), `${repository} must be present in the code allowlist`);
    assert.match(runbook, new RegExp(escaped), `${repository} must be documented in the Owner Gate runbook`);
  }

  assert.match(runbook, /no demuestra[^\n]*identidad GitHub de producción/i);
  assert.match(runbook, /no se permite escribir directamente a `main`/i);
  assert.match(runbook, /no se permite `merge_pull_request` ni `delete_file` desde NOVA/i);
});
