import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read = path => readFile(new URL("../" + path, import.meta.url), "utf8");

test("NOVA renders materialized IDs using the project queue, not a guessed preview", async () => {
  const [chat, card, types] = await Promise.all(["src/components/NovaRealtimeChat.tsx", "src/components/DraftCard.tsx", "src/components/nova-chat-types.ts"].map(read));
  assert.match(types, /id\?: string \| null/);
  assert.match(chat, /status=needs_approval&limit=100/);
  assert.match(chat, /status=approved&limit=100/);
  assert.match(chat, /liveActions\.find\(action => action\.id === draft\.id\)/);
  assert.match(chat, /queueSnapshot\.projectId === projectId/);
  assert.match(card, /queueVerified && action && action\.id === id/);
  assert.match(card, /Por verificar/);
  assert.match(card, /aria-expanded=\{expanded\}/);
  assert.match(card, /action_id=.*encodeURIComponent\(id\)/);
  assert.match(card, /!persisted && draft\.enqueued === false && draft\.executed === false/);
  assert.doesNotMatch(card, /Requiere materialización segura/);
  assert.match(chat, /actions: item\.actions\?\.filter/);
});
test("targeted action review remains authenticated and project scoped", async () => {
  const [route, worker, page, center] = await Promise.all(["src/app/api/agi/runtime/actions/route.ts", "src/lib/agi-action-execution.ts", "src/app/owner/actions/page.tsx", "src/components/owner/OwnerApprovalCenter.tsx"].map(read));
  assert.match(route, /z\.string\(\)\.uuid\(\)\.safeParse\(actionId\)/);
  assert.match(route, /project_id: ctx\.project_id[\s\S]*action_id: actionId/);
  assert.match(worker, /if \(params\.action_id\) query = query\.eq\("id", params\.action_id\)/);
  assert.match(page, /requireOwnerAal2Page/);
  assert.match(center, /params\.set\("action_id", selectedId\)/);
  assert.match(center, /Confirmar aprobación/);
  assert.match(center, /data\.ok !== true/);
  assert.match(center, /sequence_index/);
});
test("history and aliases remain connected", async () => {
  const [chat, history, shell, home] = await Promise.all(["src/components/NovaRealtimeChat.tsx", "src/components/NovaHistoryPanel.tsx", "src/components/PrivateShell.tsx", "src/components/owner/OwnerUnifiedApprovals.tsx"].map(read));
  assert.match(chat, /<NovaHistoryPanel \/>/);
  assert.match(chat, /threadId = requestedThreadId \|\| newThreadId/);
  assert.match(history, /router\.push\("\/chat\?thread_id="/);
  assert.match(shell, /pathname === "\/owner\/nova"/);
  assert.match(home, /status=needs_approval&limit=10/);
});
