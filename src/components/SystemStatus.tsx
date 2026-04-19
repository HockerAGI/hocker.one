"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CircleDot, RefreshCw, ShieldAlert, SignalHigh, Sparkles } from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase-browser";

type SystemState = "online" | "syncing" | "error";

type StatusSnapshot = {
  onlineNodes: number;
  runningCommands: number;
  pendingCommands: number;
  recentEvents: number;
  lastSeenAt: string | null;
};

function formatRelativeTime(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  });
}

export default function SystemStatus() {
  const [state, setState] = useState<SystemState>("online");
  const [snapshot, setSnapshot] = useState<StatusSnapshot>({
    onlineNodes: 0,
    runningCommands: 0,
    pendingCommands: 0,
    recentEvents: 0,
    lastSeenAt: null,
  });
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createBrowserSupabase(), []);

  const load = useCallback(async () => {
    setLoading(true);

    try {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const [nodesRes, commandsRes, eventsRes] = await Promise.all([
        supabase.from("nodes").select("id,status,updated_at,last_seen_at"),
        supabase.from("commands").select("id,status,created_at,updated_at").order("created_at", { ascending: false }).limit(50),
        supabase.from("events").select("id,created_at").gte("created_at", since).limit(50),
      ]);

      if (nodesRes.error) throw nodesRes.error;
      if (commandsRes.error) throw commandsRes.error;
      if (eventsRes.error) throw eventsRes.error;

      const nodes = (nodesRes.data ?? []) as Array<{ status?: string; last_seen_at?: string | null; updated_at?: string | null }>;
      const commands = (commandsRes.data ?? []) as Array<{ status?: string }>;
      const events = eventsRes.data ?? [];

      const onlineNodes = nodes.filter((n) => n.status === "online").length;
      const runningCommands = commands.filter((c) => c.status === "running").length;
      const pendingCommands = commands.filter((c) => c.status === "queued" || c.status === "needs_approval").length;
      const lastSeenAt =
        nodes
          .map((n) => n.last_seen_at ?? n.updated_at ?? null)
          .filter(Boolean)
          .sort()
          .at(-1) ?? null;

      setSnapshot({
        onlineNodes,
        runningCommands,
        pendingCommands,
        recentEvents: events.length,
        lastSeenAt,
      });

      setState(runningCommands > 0 || pendingCommands > 0 ? "syncing" : "online");
      setTimeout(() => setState((prev) => (prev === "syncing" ? "online" : prev)), 1400);
    } catch {
      setState("error");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    void load();

    const channel = supabase
      .channel("system-status-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "commands" },
        () => {
          setState("syncing");
          void load();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "nodes" },
        () => {
          setState("syncing");
          void load();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events" },
        () => {
          setState("syncing");
          void load();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load, supabase]);

  const tone = {
    online: "bg-emerald-400",
    syncing: "bg-sky-400",
    error: "bg-rose-400",
  }[state];

  const label = {
    online: "Núcleo en línea",
    syncing: "Sincronizando",
    error: "Anomalía detectada",
  }[state];

  return (
    <div className="hocker-panel-pro relative overflow-hidden border-white/5 bg-white/[0.03] px-4 py-3 shadow-[0_18px_70px_rgba(2,6,23,0.18)] backdrop-blur-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.09),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.08),transparent_24%)]" />

      <div className="relative flex items-center gap-4">
        <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/5 bg-slate-950/70">
          <span className={`absolute inset-0 rounded-2xl opacity-70 blur-md ${tone}`} />
          <CircleDot className={`relative z-10 h-5 w-5 ${state === "error" ? "text-rose-300" : state === "syncing" ? "text-sky-300" : "text-emerald-300"}`} />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.34em] text-slate-500">
            Estado del sistema
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className={`text-sm font-black uppercase tracking-[0.24em] ${
              state === "error" ? "text-rose-200" : state === "syncing" ? "text-sky-200" : "text-emerald-200"
            }`}>
              {label}
            </span>
            {loading ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.03] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.28em] text-slate-300">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                Actualizando
              </span>
            ) : null}
          </div>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <span className="rounded-full border border-white/5 bg-white/[0.03] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-slate-300">
            {snapshot.onlineNodes} nodos
          </span>
          <span className="rounded-full border border-white/5 bg-white/[0.03] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.28em] text-slate-300">
            {snapshot.runningCommands} en curso
          </span>
        </div>
      </div>

      <div className="relative mt-4 grid gap-3 sm:grid-cols-3">
        <div className="nova-mini-card">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
            <SignalHigh className="h-4 w-4 text-sky-300" />
            Nodos vivos
          </div>
          <p className="mt-2 text-2xl font-black text-white">
            {snapshot.onlineNodes}
          </p>
        </div>

        <div className="nova-mini-card">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
            <Sparkles className="h-4 w-4 text-sky-300" />
            Comandos
          </div>
          <p className="mt-2 text-2xl font-black text-white">
            {snapshot.runningCommands + snapshot.pendingCommands}
          </p>
        </div>

        <div className="nova-mini-card">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
            <ShieldAlert className="h-4 w-4 text-sky-300" />
            Última señal
          </div>
          <p className="mt-2 text-xs font-semibold text-slate-200">
            {formatRelativeTime(snapshot.lastSeenAt)}
          </p>
        </div>
      </div>

      <div className="relative mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
        Eventos 24h: {snapshot.recentEvents}
      </div>
    </div>
  );
}