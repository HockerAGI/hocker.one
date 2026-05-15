"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronDown, RefreshCw, Search, ShieldCheck, SquareCheckBig, XCircle } from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { getErrorMessage } from "@/lib/errors";
import { useWorkspace } from "@/components/WorkspaceContext";
import type { CommandRow, CommandStatus, JsonObject } from "@/lib/types";
import { normalizeCommandStatus } from "@/lib/types";

type QueueItem = CommandRow;

const FILTERS: Array<{ value: "all" | CommandStatus; label: string }> = [
  { value: "all", label: "Todo" },
  { value: "needs_approval", label: "Pendientes" },
  { value: "running", label: "En curso" },
  { value: "done", label: "Listas" },
  { value: "error", label: "Con error" },
  { value: "canceled", label: "Canceladas" },
];

function cx(...parts: Array<string | false | null | undefined>): string { return parts.filter(Boolean).join(" "); }
function statusClasses(status: CommandStatus): string { if (status === "needs_approval") return "border-amber-500/20 bg-amber-500/10 text-amber-300"; if (status === "running") return "border-sky-500/20 bg-sky-500/10 text-sky-300"; if (status === "done") return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"; if (status === "error") return "border-rose-500/20 bg-rose-500/10 text-rose-300"; if (status === "canceled") return "border-slate-500/20 bg-slate-500/10 text-slate-300"; return "border-sky-500/20 bg-sky-500/10 text-sky-300"; }
function statusLabel(status: CommandStatus): string { if (status === "needs_approval") return "Pendiente"; if (status === "running") return "En curso"; if (status === "done") return "Lista"; if (status === "error") return "Con error"; if (status === "canceled") return "Cancelada"; return "En cola"; }
function safeDate(input: string): string { const d = new Date(input); return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("es-MX"); }
function safePayload(value: unknown): string { try { return JSON.stringify(value ?? {}, null, 2); } catch { return "{}"; } }
function asJsonObject(value: unknown): JsonObject { return Boolean(value) && typeof value === "object" && !Array.isArray(value) ? (value as JsonObject) : {}; }
function humanCommand(command: string): string { const c = command.toLowerCase(); if (c.includes("github.create_pr")) return "Crear actualización"; if (c.includes("github.upsert_file")) return "Actualizar archivo"; if (c.includes("github.read_file")) return "Leer archivo"; if (c.includes("github.list")) return "Revisar archivos"; if (c.includes("supply")) return "Tarea de tienda"; if (c.includes("chido")) return "Revisión Chido"; return "Tarea del sistema"; }

export default function CommandsQueue() {
  const sb = useMemo(() => createBrowserSupabase(), []);
  const { projectId } = useWorkspace();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | CommandStatus>("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true); setError(null);
    try {
      const { data, error: queryError } = await sb.from("commands").select("id, project_id, node_id, command, payload, status, needs_approval, signature, result, error, approved_at, executed_at, started_at, finished_at, created_at").eq("project_id", projectId).order("created_at", { ascending: false }).limit(48);
      if (queryError) throw queryError;
      const rows = Array.isArray(data) ? (data as QueueItem[]).map((row) => ({ ...row, status: normalizeCommandStatus(row.status) })) : [];
      setItems(rows);
    } catch (err: unknown) { setItems([]); setError(getErrorMessage(err)); } finally { setLoading(false); }
  }, [projectId, sb]);

  useEffect(() => {
    void load();
    const channel: RealtimeChannel = sb.channel(`commands:${projectId}`).on("postgres_changes", { event: "*", schema: "public", table: "commands", filter: `project_id=eq.${projectId}` }, () => { void load(); }).subscribe();
    return () => { void sb.removeChannel(channel); };
  }, [load, projectId, sb]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchFilter = filter === "all" ? true : item.status === filter;
      const visible = `${humanCommand(item.command)} ${item.command} ${item.node_id} ${item.id}`.toLowerCase();
      return matchFilter && (!normalizedQuery || visible.includes(normalizedQuery));
    });
  }, [filter, items, query]);

  const stats = useMemo(() => ({ pending: items.filter((item) => item.status === "needs_approval").length, running: items.filter((item) => item.status === "running").length, done: items.filter((item) => item.status === "done").length, errorCount: items.filter((item) => item.status === "error").length }), [items]);

  const approve = async (id: string) => { setBusyId(id); try { const res = await fetch("/api/commands/approve", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, project_id: projectId, approved: true }) }); if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || "No se pudo aprobar."); } await load(); } catch (err: unknown) { setError(getErrorMessage(err)); } finally { setBusyId(null); } };
  const reject = async (id: string) => { setBusyId(id); try { const res = await fetch("/api/commands/reject", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, project_id: projectId }) }); if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || "No se pudo rechazar."); } await load(); } catch (err: unknown) { setError(getErrorMessage(err)); } finally { setBusyId(null); } };

  if (loading && items.length === 0) return <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">Cargando tareas...</div>;
  if (error) return <div className="rounded-[24px] border border-rose-500/20 bg-rose-500/10 p-4 text-xs text-rose-200">{error}</div>;

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"><p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Pendientes</p><p className="mt-1 text-xl font-black text-white">{stats.pending}</p></div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"><p className="text-[9px] font-black uppercase tracking-widest text-slate-500">En curso</p><p className="mt-1 text-xl font-black text-white">{stats.running}</p></div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"><p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Listas</p><p className="mt-1 text-xl font-black text-white">{stats.done}</p></div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"><p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Con error</p><p className="mt-1 text-xl font-black text-white">{stats.errorCount}</p></div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_auto]"><label className="flex items-center gap-3 rounded-[22px] border border-white/10 bg-slate-950/55 px-4 py-3"><Search className="h-4 w-4 text-slate-500" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar tarea..." className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500" /></label><button type="button" onClick={() => void load()} className="hocker-button-ghost"><RefreshCw className="h-4 w-4" />Actualizar</button></div>
      <div className="flex flex-wrap gap-2">{FILTERS.map((item) => <button key={item.value} type="button" onClick={() => setFilter(item.value)} className={cx("rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.24em] transition-all", filter === item.value ? "border-sky-400/20 bg-sky-400/10 text-sky-200" : "border-white/10 bg-white/[0.03] text-slate-300")}>{item.label}</button>)}</div>

      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">No hay tareas con este filtro.</div> : filtered.map((item) => (
          <article key={item.id} className="rounded-[24px] border border-white/10 bg-slate-950/55 p-4">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="font-black text-white">{humanCommand(item.command)}</h3><p className="mt-1 text-xs text-slate-500">{safeDate(item.created_at)}</p>{item.needs_approval ? <p className="mt-2 inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.22em] text-amber-300"><ShieldCheck className="h-3 w-3" />Requiere revisión</p> : null}</div><span className={cx("shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest", statusClasses(item.status))}>{statusLabel(item.status)}</span></div>
            <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => setOpenId(openId === item.id ? null : item.id)} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-200">Detalles técnicos<ChevronDown className={cx("h-3.5 w-3.5 transition-transform", openId === item.id && "rotate-180")} /></button>{item.needs_approval ? <><button type="button" disabled={busyId === item.id} onClick={() => void approve(item.id)} className="inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-200"><SquareCheckBig className="h-3.5 w-3.5" />Aprobar</button><button type="button" disabled={busyId === item.id} onClick={() => void reject(item.id)} className="inline-flex items-center gap-2 rounded-full border border-rose-400/15 bg-rose-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-rose-200"><XCircle className="h-3.5 w-3.5" />Rechazar</button></> : null}</div>
            {openId === item.id ? <div className="mt-4 rounded-[22px] border border-white/10 bg-slate-950/80 p-4"><p className="text-xs text-slate-400">Comando interno: <span className="break-all text-slate-200">{item.command}</span></p><p className="mt-2 text-xs text-slate-400">Equipo: <span className="text-slate-200">{item.node_id}</span></p><pre className="mt-3 overflow-auto rounded-2xl border border-white/10 bg-black/30 p-3 font-mono text-[11px] leading-relaxed text-emerald-300">{safePayload(asJsonObject(item.payload))}</pre>{item.error ? <div className="mt-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-[11px] text-rose-300">{item.error}</div> : null}</div> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
