import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import ts from "typescript";

async function decideRoutes() {
  const source = await readFile(new URL("../src/lib/unified-nova-chat-runtime.ts", import.meta.url), "utf8");
  const start = source.indexOf("export function decideNovaChatRoutes(");
  const end = source.indexOf("export async function runToolEnabledUnifiedNovaChat(", start);
  assert.ok(start >= 0 && end > start, "canonical routing function exists");
  const standalone = source.slice(start, end);
  const compiled = ts.transpileModule(standalone, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
  }).outputText;
  const exports = {};
  vm.runInNewContext(compiled, {
    exports,
    routeChatProfile: () => "nova",
    novaChatFreeOnlyRequest: () => false,
  });
  assert.equal(typeof exports.decideNovaChatRoutes, "function");
  return exports.decideNovaChatRoutes;
}

test("NOVA GitHub App E2E certification remains internal engineering, not public web search", async () => {
  const route = await decideRoutes();
  const message = [
    "NOVA, ejecuta la preparación de la certificación E2E real de GitHub App en Production.",
    "Repositorio exclusivo: HockerAGI/hocker.one.",
    "Comprueba el SHA actual de main y del archivo docs/operations/GITHUB_OWNER_GATE.md.",
    "Prepara la rama nova/github-app-write-cert-20261124.",
    "Materializa acciones create_branch, upsert_file y create_pr en cola bajo Owner Gate AAL2.",
    "Entrega evidencia de auditoría y resultados de CI.",
  ].join("\n");
  const result = route({ project_id: "hocker-one", message, allow_actions: true });
  assert.equal(result.engineeringTask, true);
  assert.equal(result.webSearchRequired, false);
  assert.equal(result.freeOnlyChat, false);
});

test("GitHub engineering action never requires web purely for current SHA or internal audit", async () => {
  const route = await decideRoutes();
  for (const message of [
    "Verifica el SHA actual de GitHub y prepara un pull request.",
    "Prepara auditoría interna del repositorio GitHub sin Internet.",
    "Ejecuta revisión del commit reciente y crea una rama GitHub.",
  ]) {
    const result = route({ project_id: "hocker-one", message, allow_actions: true });
    assert.equal(result.webSearchRequired, false, message);
    assert.equal(result.engineeringTask, true, message);
  }
});

test("Explicit external research and generic freshness retain native web-search routing", async () => {
  const route = await decideRoutes();
  for (const message of [
    "Investiga fuentes recientes sobre permisos de GitHub App.",
    "Compara los cambios actuales de GitHub según fuentes públicas.",
    "Cuál es el estado actual del mercado de IA?",
    "Auditoría reciente de riesgos económicos en Internet",
  ]) {
    assert.equal(route({ project_id: "hocker-one", message }).webSearchRequired, true, message);
  }
});

test("Free-only and specialist routing contracts remain isolated from engineering changes", async () => {
  const route = await decideRoutes();
  const internal = route({ project_id: "hocker-one", message: "Prepara branch en GitHub bajo Owner Gate", allow_actions: true });
  assert.equal(internal.freeOnlyChat, false);
  assert.equal(internal.engineeringTask, true);
  const empty = route({ project_id: "hocker-one", message: "" });
  assert.equal(empty.webSearchRequired, false);
});
