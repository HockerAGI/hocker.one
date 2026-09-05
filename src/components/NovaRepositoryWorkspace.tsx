"use client";

import { useState } from "react";
import { Code2, GitCompare, Loader2, Search, X } from "lucide-react";
import { useWorkspace } from "@/components/WorkspaceContext";

type Result = Record<string, unknown> | unknown[] | string | null;

async function callGithub(body: Record<string, unknown>): Promise<Result> {
  const response = await fetch("/api/agi/runtime/github", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project_id: "hocker-one", agi_id: "nova", dry_run: true, requires_approval: true, ...body }),
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) throw new Error(String(payload.error ?? `GitHub HTTP ${response.status}`));
  return payload.result ?? payload;
}

export default function NovaRepositoryWorkspace() {
  const { ready } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [operation, setOperation] = useState<"get_repo" | "list_tree" | "read_file" | "compare_refs">("get_repo");
  const [repository, setRepository] = useState("HockerAGI/hocker.one");
  const [ref, setRef] = useState("main");
  const [path, setPath] = useState("");
  const [base, setBase] = useState("main");
  const [head, setHead] = useState("");
  const [result, setResult] = useState<Result>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = async () => {
    if (!ready) return;
    setLoading(true); setError(null);
    try {
      const result = await callGithub({
        operation,
        repository,
        ...(operation === "list_tree" || operation === "read_file" ? { ref } : {}),
        ...(operation === "read_file" && path ? { path } : {}),
        ...(operation === "compare_refs" ? { base, head: head || "main" } : {}),
      });
      setResult(result);
    } catch (value) {
      setError(value instanceof Error ? value.message : "No se pudo consultar GitHub.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const title = operation === "get_repo" ? "Repositorio" : operation === "list_tree" ? "Árbol" : operation === "read_file" ? "Archivo" : "Diff";

  return (
    <div className="pointer-events-none absolute inset-x-3 bottom-[16.25rem] z-30 flex justify-center sm:inset-x-5">
      <div className="pointer-events-auto flex w-full max-w-[860px] justify-end">
        {open ? (
          <section aria-label="Repository Workspace de NOVA" className="mb-2 w-full max-w-[620px] overflow-hidden rounded-2xl border border-white/[0.10] bg-[#07101d]/96 p-3 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3 px-1 pb-3">
              <div>
                <p className="text-sm font-semibold text-white">Repository Workspace</p>
                <p className="text-xs text-slate-500">Lectura real desde GitHub. Escrituras siguen el flujo branch → file → PR → Owner Gate.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-white/[0.06] hover:text-white" aria-label="Cerrar Repository Workspace"><X className="h-4 w-4" /></button>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <label className="text-[11px] text-slate-500">Operación
                <select value={operation} onChange={(e) => setOperation(e.target.value as typeof operation)} className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-xs text-white">
                  <option value="get_repo">Repositorio</option>
                  <option value="list_tree">Árbol</option>
                  <option value="read_file">Archivo</option>
                  <option value="compare_refs">Comparar refs</option>
                </select>
              </label>
              <label className="text-[11px] text-slate-500">Repositorio
                <input value={repository} onChange={(e) => setRepository(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-xs text-white" placeholder="owner/repo" />
              </label>
              {(operation === "list_tree" || operation === "read_file") ? (
                <label className="text-[11px] text-slate-500">Ref
                  <input value={ref} onChange={(e) => setRef(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-xs text-white" />
                </label>
              ) : null}
              {operation === "read_file" ? (
                <label className="text-[11px] text-slate-500">Ruta
                  <input value={path} onChange={(e) => setPath(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-xs text-white" placeholder="src/..." />
                </label>
              ) : null}
              {operation === "compare_refs" ? (
                <>
                  <label className="text-[11px] text-slate-500">Base
                    <input value={base} onChange={(e) => setBase(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-xs text-white" />
                  </label>
                  <label className="text-[11px] text-slate-500">Head
                    <input value={head} onChange={(e) => setHead(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-xs text-white" placeholder="branch / SHA" />
                  </label>
                </>
              ) : null}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => void execute()} disabled={loading} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : operation === "compare_refs" ? <GitCompare className="h-3.5 w-3.5" /> : <Search className="h-3.5 w-3.5" />}
                Consultar {title}
              </button>
              <span className="inline-flex min-h-10 items-center rounded-xl border border-white/[0.07] px-3 py-2 text-[11px] text-slate-500">Escritura: Owner Gate</span>
            </div>

            {error ? <div className="mt-3 rounded-xl border border-rose-300/15 bg-rose-300/5 px-3 py-2 text-xs text-rose-100">{error}</div> : null}
            {result !== null ? <pre className="mt-3 max-h-[280px] overflow-auto rounded-xl border border-white/[0.07] bg-black/20 p-3 text-[10px] leading-5 text-slate-300">{JSON.stringify(result, null, 2)}</pre> : null}
          </section>
        ) : null}

        <button type="button" onClick={() => setOpen((value) => !value)} className="grid h-11 w-11 place-items-center rounded-xl border border-white/[0.10] bg-[#07101d]/96 text-slate-300 shadow-xl backdrop-blur-xl hover:bg-white/[0.07] hover:text-white" aria-expanded={open} aria-label={open ? "Cerrar Repository Workspace" : "Abrir Repository Workspace"} title="Repository Workspace">
          {open ? <X className="h-5 w-5" /> : <Code2 className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
