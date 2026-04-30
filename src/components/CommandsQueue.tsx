"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Filter,
  RefreshCw,
  Search,
  ShieldCheck,
  SquareCheckBig,
  SquarePen,
  XCircle,
  Clock3,
  Code2,
  FileText,
} from "lucide-react";
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

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

function statusClasses(status: CommandStatus): string {
  switch (status) {
    case "needs_approval":
      return "border-amber-500/20 bg-amber-500/10 text-amber-300";
    case "running":
      return "border-sky-500/20 bg-sky-500/10 text-sky-300";
    case "done":
      return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300";
    case "error":
      return "border-rose-500/20 bg-rose-500/10 text-rose-300";
    case "canceled":
      return "border-slate-500/20 bg-slate-500/10 text-slate-300";
    default:
      return "border-sky-500/20 bg-sky-500/10 text-sky-300";
  }
}

function statusLabel(status: CommandStatus): string {
  switch (status) {
    case "needs_approval":
      return "Pendiente";
    case "running":
      return "En curso";
    case "done":
      return "Listo";
    case "error":
      return "Error";
    case "canceled":
      return "Cancelado";
    default:
      return "En cola";
  }
}

function safeDate(input: string): string {
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("es-MX");
}

function safePayload(value: unknown): string {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return "{}";
  }
}

function asJsonObject(value: unknown): JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
}

function commandIcon(command: string) {
  if (command.includes("shell") || command.includes("write") || command.includes("run_sql")) {
    return Code2;
  }
  if (command.includes("meta") || command.includes("stripe") || command.includes("supply")) {
    return FileText;
  }
  return SquarePen;
}

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
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await sb
        .from("commands")
        .select(
          "id, project_id, node_id, command, payload, status, needs_approval, signature, result, error, approved_at, executed_at, started_at, finished_at, created_at",
        )
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(48);

      if (queryError) throw queryError;

      const rows = Array.isArray(data)
        ? (data as QueueItem[]).map((row) => ({
            ...row,
            status: normalizeCommandStatus(row.status),
          }))
        : [];

      setItems(rows);
    } catch (err: unknown) {
      setItems([]);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [projectId, sb]);

  useEffect(() => {
    void load();

    const channel: RealtimeChannel = sb
      .channel(`commands:${projectId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "commands",
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          void load();
        },
      )
      .subscribe();

    return () => {
      void sb.removeChannel(channel);
    };
  }, [load, projectId, sb]);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items.filter((item) => {
      const matchFilter = filter === "all" ? true : item.status === filter;
      const matchQuery =
        !normalizedQuery ||
        item.command.toLowerCase().includes(normalizedQuery) ||
        item.node_id.toLowerCase().includes(normalizedQuery) ||
        item.id.toLowerCase().includes(normalizedQuery);
      return matchFilter && matchQuery;
    });
  }, [filter, items, query]);

  const stats = useMemo(() => {
    const pending = items.filter((item) => item.status === "needs_approval").length;
    const running = items.filter((item) => item.status === "running").length;
    const done = items.filter((item) => item.status === "done").length;
    const errorCount = items.filter((item) => item.status === "error").length;

    return { pending, running, done, errorCount };
  }, [items]);

  const approve = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch("/api/commands/approve", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, project_id: projectId, approved: true }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo aprobar.");
      }

      await load();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch("/api/commands/reject", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, project_id: projectId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo rechazar.");
      }

      await load();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  if (loading && items.length === 0) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="animate-pulse rounded-[24px] border border-white/5 bg-slate-950/50 p-4"
          >
            <div className="h-3 w-32 rounded-full bg-slate-800" />
            <div className="mt-3 h-4 w-full rounded-full bg-slate-800/80" />
            <div className="mt-2 h-4 w-10/12 rounded-full bg-slate-800/60" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[24px] border border-rose-500/20 bg-rose-500/10 p-4 text-xs text-rose-200">
        {error}
      </div>
    );
  }

  return (
    <section className="flex h-full flex-col rounded-[34px] border border-white/5 bg-white/[0.03] p-5 shadow-[0_20px_80px_rgba(2,6,23,0.22)] sm:p-6">
      <div className="mb-5 flex flex-col gap-4 border-b border-white/5 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-sky-400">
            Actividad
          </p>
          <h3 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
            Cola de comandos
          </h3>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-400">
            Aquí ves lo que entró al sistema, lo que espera aprobación y lo que ya avanzó.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3">
            <p className="text-[9px] font-black uppercase tracking-[0.32em] text-slate-500">
              Pendientes
            </p>
            <p className="mt-1 text-xl font-black text-white">{stats.pending}</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3">
            <p className="text-[9px] font-black uppercase tracking-[0.32em] text-slate-500">
              En curso
            </p>
            <p className="mt-1 text-xl font-black text-white">{stats.running}</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3">
            <p className="text-[9px] font-black uppercase tracking-[0.32em] text-slate-500">
              Listos
            </p>
            <p className="mt-1 text-xl font-black text-white">{stats.done}</p>
          </div>
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3">
            <p className="text-[9px] font-black uppercase tracking-[0.32em] text-slate-500">
              Con error
            </p>
            <p className="mt-1 text-xl font-black text-white">{stats.errorCount}</p>
          </div>
        </div>
      </div>

      <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_auto]">
        <label className="flex items-center gap-3 rounded-[22px] border border-white/5 bg-slate-950/55 px-4 py-3">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por comando, nodo o ID..."
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
          />
        </label>

        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center justify-center gap-2 rounded-[22px] border border-sky-400/15 bg-sky-400/10 px-4 py-3 text-[10px] font-black uppercase tracking-[0.32em] text-sky-200 transition-all hover:-translate-y-0.5 hover:bg-sky-400/15"
        >
          <RefreshCw className="h-4 w-4" />
          Actualizar
        </button>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((item) => {
          const active = filter === item.value;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={cx(
                "rounded-full border px-3 py-2 text-[10px] font-black uppercase tracking-[0.28em] transition-all",
                active
                  ? "border-sky-400/20 bg-sky-400/10 text-sky-200"
                  : "border-white/5 bg-white/[0.03] text-slate-300 hover:border-white/10 hover:bg-white/[0.05]",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-sm text-slate-400">
            No hay comandos que coincidan con el filtro actual.
          </div>
        ) : (
          filtered.map((item) => {
            const Icon = commandIcon(item.command);

            return (
              <article
                key={item.id}
                className="group rounded-[26px] border border-white/5 bg-slate-950/55 p-4 shadow-[0_10px_50px_rgba(2,6,23,0.15)] transition-all duration-300 hover:border-sky-500/20 hover:bg-slate-900/65"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.03] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-slate-300">
                        <Icon className="h-3.5 w-3.5 text-sky-300" />
                        {item.command}
                      </span>
                      {item.needs_approval ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.26em] text-amber-300">
                          <ShieldCheck className="h-3 w-3" />
                          Revisión
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-3 text-[11px] text-slate-400">
                      Equipo:{" "}
                      <span className="text-slate-200">{item.node_id}</span>
                    </p>

                    <p className="mt-1 text-[11px] text-slate-500">
                      {safeDate(item.created_at)}
                    </p>
                  </div>

                  <span
                    className={cx(
                      "shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest",
                      statusClasses(item.status),
                    )}
                  >
                    {statusLabel(item.status)}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setOpenId(openId === item.id ? null : item.id)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.03] px-3 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-slate-200 transition-all hover:border-sky-400/20 hover:bg-sky-400/10"
                  >
                    Ver detalles
                    <ChevronDown className={cx("h-3.5 w-3.5 transition-transform", openId === item.id && "rotate-180")} />
                  </button>

                  {item.needs_approval ? (
                    <>
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => void approve(item.id)}
                        className="inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-emerald-200 transition-all hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <SquareCheckBig className="h-3.5 w-3.5" />
                        Aprobar
                      </button>
                      <button
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => void reject(item.id)}
                        className="inline-flex items-center gap-2 rounded-full border border-rose-400/15 bg-rose-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-rose-200 transition-all hover:bg-rose-400/15 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Rechazar
                      </button>
                    </>
                  ) : null}
                </div>

                {openId === item.id ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                        Creado
                      </p>
                      <p className="mt-1 text-xs text-slate-200">
                        {safeDate(item.created_at)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                        Aprobado
                      </p>
                      <p className="mt-1 text-xs text-slate-200">
                        {item.approved_at ? safeDate(item.approved_at) : "—"}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                        Terminado
                      </p>
                      <p className="mt-1 text-xs text-slate-200">
                        {item.finished_at ? safeDate(item.finished_at) : "—"}
                      </p>
                    </div>

                    <div className="sm:col-span-3">
                      <div className="overflow-hidden rounded-[22px] border border-white/10 bg-slate-950/80 shadow-inner">
                        <pre className="custom-scrollbar overflow-auto p-4 font-mono text-[11px] leading-relaxed text-emerald-300">
                          {safePayload(asJsonObject(item.payload))}
                        </pre>
                      </div>
                    </div>

                    {item.error ? (
                      <div className="sm:col-span-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-[11px] leading-relaxed text-rose-300">
                        {item.error}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}