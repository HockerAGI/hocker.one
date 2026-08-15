import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Pulso is a focused verified-status workspace without duplicating NOVA chat", async () => {
  const source = await read("src/app/app/pulso/page.tsx");

  assert.match(source, /getHockerOperationalSnapshot/);
  assert.match(source, /getHockerLivePulseSummary/);
  assert.match(source, />Pulso</);
  assert.match(source, /Requiere atención/);
  assert.match(source, /Ahora/);
  assert.match(source, /Aprendizaje/);
  assert.doesNotMatch(source, /NovaRealtimeChat/);
});

test("Recursos is a human facade over real registries", async () => {
  const source = await read("src/app/app/recursos/page.tsx");

  assert.match(source, /getMcpRegistry/);
  assert.match(source, /CANONICAL_INTEGRATIONS/);
  assert.match(source, />Recursos</);
  assert.match(source, /Nativo/);
  assert.match(source, /Conectado/);
  assert.match(source, /Protegido/);
  assert.match(source, /href="\/integrations"/);
  assert.match(source, /href="\/agis"/);
  assert.match(source, /href="\/memory"/);
  assert.doesNotMatch(source, /Importar ahora|Instalar ahora/);
});

test("primary navigation targets the new human workspaces", async () => {
  const source = await read("src/lib/hocker-navigation.ts");

  assert.match(source, /id: "pulso"[\s\S]*href: "\/app\/pulso"/);
  assert.match(source, /id: "recursos"[\s\S]*href: "\/app\/recursos"/);
});
