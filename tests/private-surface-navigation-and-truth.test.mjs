import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
const read = p => readFile(new URL("../" + p, import.meta.url), "utf8");

test("legacy Owner surfaces use real protected routes", async () => {
  for (const [name, href] of [["apps","/apps"],["agis","/agis"],["ecosystem","/map"]]) {
    const source = await read("src/app/owner/" + name + "/page.tsx");
    assert.match(source, /await requirePrivateSession\(\)/);
    assert.ok(source.includes('redirect("' + href + '")'));
    assert.doesNotMatch(source, /Aquí se mostrará|Aquí irá|La siguiente etapa/);
  }
  const oldCenter = await read("src/components/hocker-2c/owner/OwnerCommandCenter.tsx");
  assert.doesNotMatch(oldCenter, /value="Activa"|13-2C-B stable/);
});
test("manual refresh requests fresh server content and approvals have the right destination", async () => {
  const button = await read("src/components/RefreshDataButton.tsx");
  assert.match(button, /router\.refresh\(\)/);
  assert.match(button, /disabled=\{pending\}/);
  for (const path of ["apps","status","supply","memory","security","owner/evidence"]) {
    const source = await read("src/app/" + path + "/page.tsx");
    assert.match(source, /<RefreshDataButton \/>/);
  }
  for (const path of ["owner/evidence","integrations","live"]) {
    const source = await read("src/app/" + path + "/page.tsx");
    assert.doesNotMatch(source, /href="\/commands"[^>]*>[^<]*aprobaciones/i);
    assert.match(source, /href="\/owner\/actions"/);
  }
});
test("failed data reads cannot be rendered as zero records", async () => {
  const [memory, supply, evidence] = await Promise.all(["memory","supply","owner/evidence"].map(p => read("src/app/" + p + "/page.tsx")));
  assert.match(memory, /error \? "—" : events\.length/);
  assert.match(supply, /data\.ok \? data\.stockUnits : "—"/);
  assert.match(supply, /stockRows\.count === \(stockRows\.data \?\? \[\]\)\.length/);
  assert.match(evidence, /evidence\.ok \? evidence\.counts\.runs : "—"/);
});
test("Owner review fingerprint changes on real changes but not JSON key order", async () => {
  const source = await read("src/lib/owner-action-review.ts");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  const { ownerActionReviewFingerprint: fingerprint, buildOwnerActionReview: review } =
    await import("data:text/javascript;base64," + Buffer.from(compiled).toString("base64"));
  const item = { id: "fixture-action", project_id: "fixture-project", action_type: "github.upsert_file",
    tool_key: "github", title: "Fixture", status: "needs_approval", risk_level: "high", dry_run: true, requires_approval: true,
    updated_at: "2026-11-25T00:00:00Z", payload: { materializer_version: "12.7K-2A",
      repository: "fixture/repo", target_branch: "test/fixture", path: "test.txt", content: "test",
      internal_fixture_key: "not returned", write_plan: { valid: true, steps: ["test"], rollback_plan: { steps: ["restore"] } } } };
  const reordered = { ...item, payload: Object.fromEntries(Object.entries(item.payload).reverse()) };
  assert.equal(fingerprint(item), fingerprint(reordered));
  assert.notEqual(fingerprint(item), fingerprint({ ...item, payload: { ...item.payload, content: "different" } }));
  assert.notEqual(fingerprint(item), fingerprint({ ...item, status: "approved" }));
  assert.notEqual(fingerprint(item), fingerprint({ ...item, project_id: "other" }));
  assert.equal(review(item).content, "test");
  assert.equal(review(item).fingerprint, fingerprint(item));
  assert.equal(Object.hasOwn(review(item), "internal_fixture_key"), false);
  assert.throws(() => review({ ...item, tool_key: "vercel" }), /ACTION_REVIEW_NOT_SUPPORTED/);
  assert.throws(() => review({ ...item, requires_approval: false }), /ACTION_REVIEW_NOT_SUPPORTED/);
});
