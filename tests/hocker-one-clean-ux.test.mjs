import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("NOVA route is immersive instead of a dashboard card", async () => {
  const [page, chat] = await Promise.all([
    read("src/app/chat/page.tsx"),
    read("src/components/NovaRealtimeChat.tsx"),
  ]);

  assert.doesNotMatch(page, /PageShell/);
  assert.doesNotMatch(page, /min-h-\[72dvh\]|rounded-\[2rem\]/);
  assert.match(page, /NovaRealtimeChat|NovaWorkspace/);
  assert.match(chat, /100dvh|dvh/);
  assert.doesNotMatch(chat, />Owner Gate</);
});

test("NOVA primary view hides technical telemetry behind optional detail", async () => {
  const chat = await read("src/components/NovaRealtimeChat.tsx");
  assert.match(chat, /Detalle/);
  assert.doesNotMatch(chat, /verificadas · .*configuradas/);
  assert.doesNotMatch(chat, /provider|model/i);
});

test("AGIs primary view is a compact list and technical history is progressive detail", async () => {
  const page = await read("src/app/agis/page.tsx");
  assert.match(page, /<details|AgiDetail|Detalle/);
  assert.doesNotMatch(page, /grid gap-4 md:grid-cols-2 xl:grid-cols-3/);
  assert.doesNotMatch(page, /Worker:/);
  assert.doesNotMatch(page, /Estado de catálogo:/);
  assert.doesNotMatch(page, /evidence_percent/);
});

test("simple user-facing state vocabulary is shared by the clean UI", async () => {
  const [agis, control] = await Promise.all([
    read("src/app/agis/page.tsx"),
    read("src/components/agi/AgiEvalBatchControl.tsx"),
  ]);
  for (const label of ["Listo", "Pendiente", "En proceso", "Requiere atención"]) {
    assert.match(`${agis}\n${control}`, new RegExp(label));
  }
});
