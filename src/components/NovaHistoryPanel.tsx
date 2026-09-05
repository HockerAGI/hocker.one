"use client";
import { useEffect, useState } from "react";
import { History, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/components/WorkspaceContext";

type Session = { id: string; thread_id: string; title: string | null; summary: string | null; status: string; updated_at: string };

export default function NovaHistoryPanel() {
  const { projectId, ready } = useWorkspace();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !ready || sessions.length) return;
    let active = true;
    setLoading(true); setError(null);
    fetch("/api/nova/history?project_id=" + encodeURIComponent(projectId) + "&limit=20", { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok || body.ok === false) throw new Error(body.error ?? "No se pudo cargar el historial.");
        if (active) setSessions(Array.isArray(body.sessions) ? body.sessions : []);
      })
      .catch((value) => { if (active) setError(value instanceof Error ? value.message : "No se pudo cargar el historial."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [open, projectId, ready, sessions.length]);

  return (<><button type="button" onClick={() => setOpen((value) => !value)} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-xs font-medium text-slate-400 hover:bg-white/[0.05] hover:text-white" aria-expanded={open} aria-label={open ? "Cerrar historial de NOVA" : "Abrir historial de NOVA"} title="Historial"><History className="h-4 w-4" /><span className="hidden sm:inline">Historial</span></button>
    {open ? <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" role="presentation" onClick={() => setOpen(false)}>
      <aside className="absolute inset-y-0 left-0 flex w-[min(92vw,380px)] flex-col border-r border-white/[0.08] bg-[#07101d] shadow-2xl" aria-label="Historial de conversaciones NOVA" onClick={(event) => event.stopPropagation()}>
        <div className="flex min-h-14 items-center justify-between border-b border-white/[0.06] px-4"><div><p className="text-sm font-semibold text-white">Historial</p><p className="text-[11px] text-slate-500">Conversaciones persistidas de NOVA</p></div><button type="button" onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-lg text-slate-400 hover:bg-white/[0.06] hover:text-white" aria-label="Cerrar historial"><X className="h-4 w-4" /></button></div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {loading ? <div className="flex items-center gap-2 px-2 py-4 text-xs text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</div>
          : error ? <div className="rounded-xl border border-rose-300/15 bg-rose-300/5 px-3 py-2 text-xs text-rose-100">{error}</div>
          : sessions.length === 0 ? <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-4 text-center text-xs text-slate-500">Todavía no hay conversaciones persistidas.</div>
          : <div className="space-y-2">{sessions.map((session) => <button key={session.id} type="button" onClick={() => router.push("/chat?thread_id=" + encodeURIComponent(session.thread_id))} className="w-full rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-3 text-left hover:bg-white/[0.05]"><span className="block truncate text-sm font-medium text-white">{session.title || "Conversación con NOVA"}</span><span className="mt-1 block text-[11px] leading-5 text-slate-500">{session.summary || "Sin resumen todavía."}</span><span className="mt-2 block text-[10px] uppercase tracking-[0.12em] text-slate-600">{new Date(session.updated_at).toLocaleString()}</span></button>)}</div>}
        </div>
      </aside>
    </div> : null}
  </>);
}