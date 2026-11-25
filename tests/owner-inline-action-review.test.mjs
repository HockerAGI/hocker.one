import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read = p => readFile(new URL("../" + p, import.meta.url), "utf8");

test("same exact-action review is used in chat and approval center", async () => {
  const [draft, center, review] = await Promise.all(["src/components/DraftCard.tsx", "src/components/owner/OwnerApprovalCenter.tsx", "src/components/OwnerInlineActionReview.tsx"].map(read));
  assert.match(draft, /<OwnerInlineActionReview projectId=\{projectId\} actionId=\{id\}/);
  assert.match(center, /<OwnerInlineActionReview projectId=\{projectId\} actionId=\{inlineReviewId\}/);
  assert.match(review, /data\.review\?\.id !== actionId/);
  assert.match(review, /expected_review_fingerprint: review\.fingerprint/);
  assert.match(review, /review\.content/);
  assert.match(review, /!allowed \|\| !ack/);
  assert.match(review, /data\.item\?\.status !== "approved"/);
  assert.doesNotMatch(review, /actions\/execute/);
});
test("review and approval preserve Owner MFA, exact scope, snapshot and production gate", async () => {
  const [api, helper, execution] = await Promise.all(["src/app/api/agi/runtime/actions/decision/route.ts", "src/lib/owner-action-review.ts", "src/lib/agi-action-execution.ts"].map(read));
  assert.match(api, /export async function GET[\s\S]*requireOwnerAal2Api\(parsed\.project_id\)/);
  assert.match(api, /listAgiActions\(\{ project_id: parsed\.project_id, action_id: parsed\.action_id, limit: 1 \}\)/);
  assert.match(api, /can_approve: process\.env\.VERCEL_ENV === "production"/);
  assert.match(api, /parsed\.expected_review_fingerprint && \(parsed\.decision !== "approve" \|\| process\.env\.VERCEL_ENV !== "production"\)/);
  assert.match(helper, /createHash\("sha256"\)/);
  assert.match(helper, /payload: item\.payload/);
  assert.match(execution, /await assertGuidedGithubApprovalOrder[\s\S]*ownerActionReviewFingerprint\(item\) !== params\.expected_review_fingerprint/);
  assert.match(execution, /\.eq\("project_id", params\.project_id\)\.eq\("id", item\.id\)\.eq\("status", item\.status\)/);
  assert.match(execution, /query\.eq\("updated_at", item\.updated_at\)/);
});
test("task and governance surfaces report real results and preserve controls", async () => {
  const [command, queue, governance] = await Promise.all(["src/components/CommandBox.tsx", "src/components/CommandsQueue.tsx", "src/components/GovernancePanel.tsx"].map(read));
  assert.match(command, /result\.ok !== true \|\| !result\.item\?\.id/);
  assert.match(command, /result\.item\.status === "needs_approval"/);
  assert.doesNotMatch(command, /needs_approval: false/);
  assert.match(queue, /data\.ok !== true \|\| !Array\.isArray\(data\.items\)/);
  assert.match(governance, /meta: controls\.meta \?\? \{\}/);
  assert.match(governance, /await load\(\);\s*setError\(getErrorMessage\(saveError\)\)/);
});
