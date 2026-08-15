import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("NOVA composer uses the real voice input and keeps unavailable attachments disabled", async () => {
  const source = await read("src/components/NovaRealtimeChat.tsx");

  assert.match(source, /import VoiceInput from "@\/components\/VoiceInput"/);
  assert.match(source, /<VoiceInput/);
  assert.match(source, /onTranscript=/);
  assert.match(source, /Adjuntos aún no habilitados/);
  assert.match(source, /<button type="button" disabled title="Adjuntos aún no habilitados"/);
});

test("NOVA workspace copy is human and avoids exposing internal gate jargon in the primary header", async () => {
  const source = await read("src/components/NovaRealtimeChat.tsx");

  assert.match(source, /Pídele algo a NOVA/);
  assert.match(source, /Aprobaciones/);
  assert.doesNotMatch(source, />Owner Gate</);
  assert.doesNotMatch(source, /Canal privado con NOVA/);
});
