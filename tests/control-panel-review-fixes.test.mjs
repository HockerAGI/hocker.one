import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("catalog and map require an authorized private session", async () => {
  for (const path of ["src/app/catalog/layout.tsx", "src/app/map/layout.tsx"]) {
    const source = await read(path);
    assert.match(source, /requirePrivateSession/);
    assert.match(source, /await requirePrivateSession\(\)/);
  }
});

test("enqueued NOVA actions cannot be dismissed as a local cancellation", async () => {
  const source = await read("src/components/DraftCard.tsx");
  assert.match(source, /draft\.enqueued !== true/);
  assert.match(source, /Rechazar en Owner Gate/);
  assert.match(source, /disabled=\{!canCancelLocally\}/);
});

test("NOVA chat preserves its thread and fails closed when approval state is unreadable", async () => {
  const source = await read("src/components/NovaRealtimeChat.tsx");
  assert.match(source, /const \[threadId\] = useState\(\(\) => requestedThreadId \|\| generateId\(\)\)/);
  assert.equal((source.match(/thread_id: threadId/g) ?? []).length, 2);
  assert.match(source, /unreadableQueueLock/);
  assert.match(source, /can_start_new_task: false/);
  assert.match(source, /Aprobaciones sin verificar/);
  assert.match(source, /payloadText === "\[DONE\]"/);
  assert.match(source, /catch \{\s*if \(eventName === "message"\)/s);
});

test("operational metrics use canonical blocking statuses and an exact 24-hour count", async () => {
  const source = await read("src/lib/hocker-operational-state.ts");
  assert.match(source, /AGI_QUEUE_BLOCKING_STATUSES/);
  assert.match(source, /select\("id", \{ count: "exact", head: true \}\)/);
  assert.match(source, /gte\("created_at", since24h\)/);
  assert.match(source, /latestRunsPromise/);
  assert.match(source, /Promise\.all\(\[/);
  assert.doesNotMatch(source, /\.limit\(250\)/);
});
