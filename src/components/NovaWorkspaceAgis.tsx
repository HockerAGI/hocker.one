"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BrainCircuit, Loader2, RefreshCw, X } from "lucide-react";
import { useWorkspace } from "@/components/WorkspaceContext";

type AgiRow = {
  agi_id: string;
  name?: string;
  role?: string;
  status?: string;
  autonomy_level?: string;
  allow_actions?: boolean;
};

type RuntimeSummary = {
  ok: boolean;
  checked_at: string;
  counts?: { agents?: number };
  integrations?: Array<{ tool_key: string; status: string; last_verified_at?: string | null }>;
};

type ResponseBody = { ok?: boolean; summary?: RuntimeSummary; error?: string };

export default function NovaWorkspaceAgis() {
  const { projectId, ready } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState<AgiRow[]>([]);
  const [summary, setSummary] = useState<RuntimeSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!ready) return;
    setLoading(true);
    setError(null);
    try {
      const [agentResponse, summaryResponse] = await Promise.all([
        fetch("/api/agi/agents?project_id=" + encodeURIComponent(projectId), { cache: "no-store" }),
        fetch("/api/agi/runtime/summary?project_id=" + encodeURIComponent(projectId), { cache: "no-store" }),
      ]);
      const agentBody = await agentResponse.json().catch(() => ({})) as { ok?: boolean; agents?: AgiRow[]; error?: string };
      const summaryBody = await summaryResponse.json().catch(() => ({})) as ResponseBody;
      if (!agentResponse.ok || agentBody.ok === false) throw new Error(agentBody.error ?? `AGI HTTP ${agentResponse.status}`);
      if (!summaryResponse.ok || summaryBody.ok === false) throw new Error(summaryBody.error ?? `Runtime HTTP ${summaryResponse.status}`);
      setAgents(Array.isArray(agentBody.agents) ? agentBody.agents : []);
      setSummary(summaryBody.summary ?? null);
    } catch (value) {
      setError(value instanceof Error ? value.message : "No se pudo consultar el estado de las AGIs.");
    } finally {
      setLoading(false);
    }
  }, [projectId, ready]);

  useEffect(() => {
    if (open && agents.length === 0 && !loading) void load();
  }, [agents.length, load, loading, open]);

  const grouped = useMemo(() => agents.map((agent) => ({
    ...agent,
    label: agent.name || agent.agi_id,
    live:
      agent.status === "online" ||
      agent.status === "connected" &&
      Boolean(summary?.integrations?.find((item) => item.tool_key === "nova_orchestrator")?.last_verified_at),
  })), [agents, summary]);

  return (
    <div className="pointer-events-none absolute inset-x-3 bottom-[21.5rem] z-30 flex justify-center sm:inset-x-5">
      <div className="pointer-events-auto flex w-full max-w-[860px] justify-end">
        {open ? (
          <section aria-label="AGIs de NOVA" className="mb-2 w-full max-w-[620px] overflow-hidden rounded-2xl border border-white/[0.10] bg-[#07101d]/96 p-3 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3 px-1 pb-3">
              <div>
                <p className="text-sm font-semibold text-white">AGIs</p>
                <p className="text-xs text-slate-500">16 identidades canónicas. La señal viva se muestra sólo con evidencia reciente.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-white/[0.06] hover:text-white" aria-label="Cerrar AGIs"><X className="h-4 w-4" /></button>
            </div>

            {loading ? (
              <div className="flex items-center gap-2 px-2 py-5 text-xs text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Consultando registro AGI…</div>
            ) : error ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-rose-300/15 bg-rose-300/5 px-3 py-2 text-xs text-rose-100">{error}</div>
                <button type="button" onClick={() => void load()} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white"><RefreshCw className="h-3.5 w-3.5" /> Reintentar</button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3"><p className="text-[10px] uppercase tracking-[0.14em] text-slate-600">Registro</p><p className="mt-1 text-lg font-black text-white">{agents.length}/16</p></div>
                  <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3"><p className="text-[10px] uppercase tracking-[0.14em] text-slate-600">Acciones</p><p className="mt-1 text-lg font-black text-white">0</p></div>
                  <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3"><p className="text-[10px] uppercase tracking-[0.14em] text-slate-600">Fresh</p><p className="mt-1 text-lg font-black text-white">{grouped.filter((agent) => agent.live).length}</p></div>
                </div>

                <div className="max-h-[300px] space-y-1 overflow-auto pr-1">
                  {grouped.map((agent) => (
                    <div key={agent.agi_id} className="flex items-center gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-3 py-2.5">
                      <span className={agent.live ? "h-2 w-2 rounded-full bg-emerald-300" : "h-2 w-2 rounded-full bg-slate-700"} aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-white">{agent.label}</p>
                        <p className="truncate text-[10px] text-slate-600">{agent.role || "AGI canónica"} · allow_actions={String(agent.allow_actions ?? false)}</p>
                      </div>
                      <span className="text-[10px] text-slate-500">{agent.live ? "Señal fresca" : "Sin señal fresca"}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between border-t border-white/[0.06] pt-3">
                  <span className="text-[10px] text-slate-600">Actualizado {summary?.checked_at ? new Date(summary.checked_at).toLocaleTimeString() : "—"}</span>
                  <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"><RefreshCw className="h-3.5 w-3.5" /> Actualizar</button>
                </div>
              </div>
            )}
          </section>
        ) : null}

        <button type="button" onClick={() => setOpen((value) => !value)} className="grid h-11 w-11 place-items-center rounded-xl border border-white/[0.10] bg-[#07101d]/96 text-slate-300 shadow-xl backdrop-blur-xl hover:bg-white/[0.07] hover:text-white" aria-expanded={open} aria-label={open ? "Cerrar AGIs" : "Abrir AGIs"} title="AGIs de NOVA">
          {open ? <X className="h-5 w-5" /> : <BrainCircuit className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
