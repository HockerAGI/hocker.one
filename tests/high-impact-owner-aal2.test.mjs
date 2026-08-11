import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("AGI action approval requires Owner AAL2 while rejection retains Owner role gate", async () => {
  const route = await read("src/app/api/agi/runtime/actions/decision/route.ts");

  assert.match(route, /if \(parsed\.decision === "approve"\) \{/);
  assert.match(route, /requireOwnerAal2Api\(parsed\.project_id\)/);
  assert.match(route, /requireProjectRole\(parsed\.project_id, \["owner"\]\)/);
});

test("command approval requires Owner AAL2 while the rejection branch remains available to the existing role gate", async () => {
  const route = await read("src/app/api/commands/approve/route.ts");

  assert.match(route, /const ctx = await requireProjectRole\(project_id, \["owner", "admin"\]\)/);
  assert.match(route, /if \(!approved\) \{/);
  assert.match(route, /const ownerGate = await requireOwnerAal2Api\(project_id\)/);
  assert.match(route, /if \(!ownerGate\.ok\) return ownerGate\.response/);
  assert.ok(
    route.indexOf("if (!approved) {") < route.indexOf("const ownerGate = await requireOwnerAal2Api(project_id)"),
    "rejection must be evaluated before the AAL2 approval gate",
  );
});

test("governance containment remains available to admin but relaxing safeguards requires Owner AAL2", async () => {
  const route = await read("src/app/api/governance/killswitch/route.ts");

  assert.match(route, /const nextKillSwitch = toBool\(body\.kill_switch, false\)/);
  assert.match(route, /const nextAllowWrite = toBool\(body\.allow_write, false\)/);
  assert.match(route, /const relaxesSafety = !nextKillSwitch \|\| nextAllowWrite/);
  assert.match(route, /if \(relaxesSafety\) \{/);
  assert.match(route, /requireOwnerAal2Api\(project_id\)/);
  assert.match(route, /requireProjectRole\(project_id, \["owner", "admin"\]\)/);
});

test("dedicated command rejection route remains fail-safe and does not require AAL2", async () => {
  const route = await read("src/app/api/commands/reject/route.ts");

  assert.match(route, /requireProjectRole\(project_id, \["owner", "admin"\]\)/);
  assert.doesNotMatch(route, /requireOwnerAal2Api/);
});
