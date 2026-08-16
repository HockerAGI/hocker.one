import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("AGI router is provider-independent and Gateway is not a single point of failure", async () => {
  const router = await read("src/lib/agi-model-router.ts");
  const types = await read("src/lib/agi-model-providers/types.ts");
  for (const route of ["vercel-gateway", "openai-direct", "gemini-direct", "anthropic-direct", "ollama"]) {
    assert.match(types, new RegExp(route));
  }
  assert.match(router, /completeAgi/);
  assert.match(router, /vercel-gateway/);
  assert.match(router, /openai-direct/);
  assert.match(router, /gemini-direct/);
  assert.match(router, /anthropic-direct/);
  assert.match(router, /ollama/);
  assert.match(router, /429|quota|balance|rate/i);
  assert.match(router, /401|403/);
  assert.match(router, /5\d\d|>=\s*500|timeout/i);
});

test("direct provider adapters use independent endpoints", async () => {
  const openai = await read("src/lib/agi-model-providers/openai.ts");
  const gemini = await read("src/lib/agi-model-providers/gemini.ts");
  const anthropic = await read("src/lib/agi-model-providers/anthropic.ts");
  const ollama = await read("src/lib/agi-model-providers/ollama.ts");
  assert.match(openai, /api\.openai\.com\/v1\/responses/);
  assert.match(openai, /store: false/);
  assert.match(gemini, /generativelanguage\.googleapis\.com/);
  assert.match(anthropic, /api\.anthropic\.com\/v1\/messages/);
  assert.match(ollama, /\/api\/chat/);
});

test("provider and model remain telemetry while the public identity stays NOVA", async () => {
  const runtime = await read("src/lib/unified-nova-chat-runtime.ts");
  assert.match(runtime, /provider: finalCompletion\.provider/);
  assert.match(runtime, /model: finalCompletion\.model/);
  assert.match(runtime, /Identidad pública: NOVA/);
  assert.match(runtime, /La identidad pública siempre es NOVA/);
  assert.match(runtime, /No menciones proveedores, modelos, créditos, cuotas, balance, fallback/);
  assert.match(runtime, /owner_gate_only/);
});
