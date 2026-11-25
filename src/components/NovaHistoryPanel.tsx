"use client";
import { useEffect, useState } from "react";
import { History, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/components/WorkspaceContext";

type Session = { id: string; thread_id: string; title: string | null; summary: string | null; status: string; updated_at: string };

export default function NovaHistoryPanel({ disabled = false }: { disabled?: boolean }) {
  const { projectId, ready } = useWorkspace();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [attempt, setAttempt] = useState(0);
  const visible = sessions.filter(item => ((item.title ?? "") + " " + (item.summary ?? "")).toLocaleLowerCase("es-MX").includes(search.trim().toLocaleLowerCase("es-MX")));

  useEffect(() => {
    if (!open || !ready) return;
    let active = true;
    setLoading(true); setError(null); setSessions([]);
    fetch("/api/nova/history?project_id=" + encodeURIComponent(projectId) + "&limit=20", { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok || body.ok !== true || !Array.isArray(body.sessions)) throw new Error(body.error ?? "No se pudo cargar el historial.");
        if (active) setSessions(Array.isArray(body.sessions) ? body.sessions : []);
      })
      .catch(() => { if (active) setError("No se pudo cargar el historial protegido."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [open, projectId, ready, attempt]);
  useEffect(() => { if (!open) return; const close = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); }; window.addEventListener("keydown", close); return () => window.removeEventListener("keydown", close); }, [open]);

  return (<><button type="button" disabled={disabled} onClick={() => setOpen((value) => !value)} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-xs font-medium text-slate-400 hover:bg-white/[0.05] hover:text-white" aria-expanded={open} aria-label={open ? "Cerrar historial de NOVA" : "Abrir historial de NOVA"} title="Historial"><History className="h-4 w-4" /><span className="hidden sm:inline">Historial</span></button>
    {open ? <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]" role="presentation" onClick={() => setOpen(false)}>
      <aside className="absolute inset-y-0 left-0 flex w-[min(92vw,380px)] flex-col border-r border-white/[0.08] bg-[#07101d] shadow-2xl" aria-label="Historial de conversaciones NOVA" onClick={(event) => event.stopPropagation()}>
        <div className="flex min-h-14 items-center justify-between border-b border-white/[0.06] px-4"><div><p className="text-sm font-semibold text-white">Historial</p><p className="text-[11px] text-slate-500">Tus conversaciones</p></div><button type="button" onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-lg text-slate-400 hover:bg-white/[0.06] hover:text-white" aria-label="Cerrar historial"><X className="h-4 w-4" /></button></div>
        <div className="border-b border-white/10 p-3"><input aria-label="Buscar conversaciones recientes" placeholder="Buscar en conversaciones recientes" value={search} onChange={event=>setSearch(event.target.value)} className="w-full rounded-xl border border-slate-600 bg-[#101b29] px-3 py-2 text-sm text-white"/></div>
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {loading ? <div className="flex items-center gap-2 px-2 py-4 text-xs text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Cargando…</div>
          : error ? <div className="rounded-xl border border-rose-300/15 bg-rose-300/5 px-3 py-2 text-xs text-rose-100">{error} <button type="button" className="underline" onClick={()=>setAttempt(n=>n+1)}>Reintentar</button></div>
          : sessions.length === 0 ? <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-4 text-center text-xs text-slate-500">Aún no hay conversaciones.</div>
          : <div className="space-y-2">{visible.length === 0 ? <p className="text-sm text-slate-300">Sin coincidencias.</p> : null}{visible.map((session) => <button key={session.id} type="button" onClick={() => { setOpen(false); router.push("/chat?thread_id=" + encodeURIComponent(session.thread_id)); }} className="w-full rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-3 text-left hover:bg-white/[0.05]"><span className="block truncate text-sm font-medium text-white">{session.title || "Conversación con NOVA"}</span><span className="mt-1 block text-[11px] leading-5 text-slate-500">{session.summary || "Sin resumen todavía."}</span><span className="mt-2 block text-[10px] uppercase tracking-[0.12em] text-slate-600">{Number.isFinite(Date.parse(session.updated_at)) ? new Date(session.updated_at).toLocaleString("es-MX",{timeZone:"America/Tijuana"}) : "Sin fecha"}</span></button>)}</div>}
        </div>
      </aside>
    </div> : null}
  </>);
}