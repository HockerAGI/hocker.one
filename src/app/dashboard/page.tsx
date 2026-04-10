"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Brain,
  CircleDot,
  Cpu,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  Terminal,
  Waves,
  Zap,
  Layers3,
} from "lucide-react";
import BrandMark from "@/components/BrandMark";
import Hint from "@/components/Hint";
import { useWorkspace } from "@/components/WorkspaceContext";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import type { CommandRow, EventRow, NodeRow, ProjectId } from "@/lib/types";

type HealthState = "connecting" | "online" | "offline" | "error";

type RealtimePayload<T> = {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: T;
  old: T;
};

const supabase = getSupabaseBrowser();

const toneByHealth: Record<HealthState, string> = {
  connecting: "bg-sky-400/20 text-sky-200 border-sky-400/20",
  online: "bg-emerald-400/20 text-emerald-200 border-emerald-400/20",
  offline: "bg-slate-400/15 text-slate-200 border-slate-400/20",
  error: "bg-rose-400/20 text-rose-200 border-rose-400/20",
};

const nodeTone = (status: string): string => {
  switch (status) {
    case "online":
      return "bg-emerald-400";
    case "busy":
      return "bg-amber-400";
    case "warning":
      return "bg-yellow-400";
    case "error":
      return "bg-rose-400";
    default:
      return "bg-slate-500";
  }
};

const commandTone = (status: string): string => {
  switch (status) {
    case "done":
      return "text-emerald-300 border-emerald-400/20 bg-emerald-400/10";
    case "running":
      return "text-sky-300 border-sky-400/20 bg-sky-400/10";
    case "needs_approval":
      return "text-amber-300 border-amber-400/20 bg-amber-400/10";
    case "error":
      return "text-rose-300 border-rose-400/20 bg-rose-400/10";
    case "canceled":
      return "text-slate-300 border-slate-400/20 bg-slate-400/10";
    default:
      return "text-slate-300 border-white/10 bg-white/[0.04]";
  }
};

function IsoPulse() {
  return (
    <div className="relative flex h-24 w-24 items-center justify-center sm:h-28 sm:w-28">
      <div className="absolute inset-0 rounded-full bg-sky-400/15 blur-2xl animate-[pulse_5s_ease-in-out_infinite]" />
      <div className="absolute inset-2 rounded-full border border-sky-400/20 bg-slate-950/70 backdrop-blur-2xl" />
      <div className="absolute inset-5 rounded-full border border-white/10 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.16),transparent_60%)]" />
      <div className="absolute inset-[26px] rounded-full bg-sky-300 shadow-[0_0_30px_rgba(14,165,233,0.55)] animate-[pulse_2.8s_ease-in-out_infinite]" />
      <Sparkles className="relative z-10 h-6 w-6 text-slate-950" />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone = "sky",
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "sky" | "emerald" | "amber" | "rose";
}) {
  const toneStyles: Record<typeof tone, string> = {
    sky: "border-sky-400/15 bg-sky-400/[0.06]",
    emerald: "border-emerald-400/15 bg-emerald-400/[0.06]",
    amber: "border-amber-400/15 bg-amber-400/[0.06]",
    rose: "border-rose-400/15 bg-rose-400/[0.06]",
  };

  return (
    <div
      className={[
        "hocker-card-float p-4 sm:p-5",
        "border transition-all duration-300",
        toneStyles[tone],
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="hocker-title-line">{label}</p>
          <p className="mt-2 text-xl font-black tracking-tight text-white sm:text-2xl">
            {value}
          </p>
        </div>

        <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/50">
          <Icon className="h-5 w-5 text-sky-300" />
        </span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { projectId: workspaceProjectId, nodeId } = useWorkspace();

  const projectId = (workspaceProjectId || "hocker-one") as ProjectId;
  const currentNodeId = nodeId || "hocker-agi";

  const [nodes, setNodes] = useState<NodeRow[]>([]);
  const [commands, setCommands] = useState<CommandRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [health, setHealth] = useState<HealthState>("connecting");
  const [clock, setClock] = useState("");
  const [sending, setSending] = useState(false);

  const metrics = useMemo(() => {
    const onlineNodes = nodes.filter((n) => n.status === "online").length;
    const busyNodes = nodes.filter((n) => n.status === "busy").length;
    const activeCommands = commands.filter(
      (c) => c.status === "queued" || c.status === "running" || c.status === "needs_approval",
    ).length;
    const recentEvents = events.length;

    return {
      onlineNodes,
      busyNodes,
      activeCommands,
      recentEvents,
    };
  }, [nodes, commands, events]);

  useEffect(() => {
    const tick = () => {
      setClock(
        new Intl.DateTimeFormat("es-MX", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }).format(new Date()),
      );
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        setHealth(res.ok ? "online" : "error");
      } catch {
        setHealth("offline");
      }
    };

    checkHealth();
    const interval = window.setInterval(checkHealth, 5000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    let mounted = true;

    const load = async (): Promise<void> => {
      const [nodesRes, commandsRes, eventsRes] = await Promise.all([
        supabase
          .from("nodes")
          .select("*")
          .eq("project_id", projectId)
          .order("updated_at", { ascending: false }),
        supabase
          .from("commands")
          .select("*")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false })
          .limit(12),
        supabase
          .from("events")
          .select("*")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false })
          .limit(25),
      ]);

      if (!mounted) return;

      setNodes((nodesRes.data ?? []) as NodeRow[]);
      setCommands((commandsRes.data ?? []) as CommandRow[]);
      setEvents((eventsRes.data ?? []) as EventRow[]);
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [projectId]);

  useEffect(() => {
    const channel = supabase
      .channel(`hocker-one-live-${projectId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "nodes", filter: `project_id=eq.${projectId}` },
        (payload) => {
          const next = payload as RealtimePayload<NodeRow>;

          if (next.eventType === "DELETE") {
            setNodes((prev) => prev.filter((item) => item.id !== next.old.id));
            return;
          }

          setNodes((prev) => {
            const updated = prev.filter((item) => item.id !== next.new.id);
            return [next.new, ...updated].slice(0, 12);
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "commands", filter: `project_id=eq.${projectId}` },
        (payload) => {
          const next = payload as RealtimePayload<CommandRow>;

          if (next.eventType === "DELETE") {
            setCommands((prev) => prev.filter((item) => item.id !== next.old.id));
            return;
          }

          setCommands((prev) => {
            const updated = prev.filter((item) => item.id !== next.new.id);
            return [next.new, ...updated].slice(0, 12);
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "events", filter: `project_id=eq.${projectId}` },
        (payload) => {
          const next = payload as RealtimePayload<EventRow>;

          if (next.eventType === "DELETE") {
            setEvents((prev) => prev.filter((item) => item.id !== next.old.id));
            return;
          }

          setEvents((prev) => [next.new, ...prev].slice(0, 25));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [projectId]);

  const runCommand = async (command: string): Promise<void> => {
    setSending(true);

    try {
      await fetch("/api/commands", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          project_id: projectId,
          command,
          node_id: currentNodeId,
        }),
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-[1800px] flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
      <section className="hocker-panel-strong relative overflow-hidden border-sky-400/15 p-5 shadow-[0_30px_120px_rgba(2,6,23,0.55)] sm:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.10),transparent_32%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-sky-400/70 to-transparent" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <BrandMark hero className="shrink-0" />

            <div className="max-w-2xl">
              <p className="hocker-title-line">Control Hocker ONE</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Núcleo operativo en tiempo real
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
                NOVA dirige, los agentes ejecutan y la telemetría responde al instante.
                Todo en una sola vista, móvil y web.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span
              className={[
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.28em]",
                toneByHealth[health],
              ].join(" ")}
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-current opacity-60 animate-ping" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-current" />
              </span>
              {health === "online" ? "Sistema vivo" : health === "connecting" ? "Conectando" : "Atención"}
            </span>

            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black uppercase tracking-[0.28em] text-slate-300">
              <CircleDot className="h-3.5 w-3.5 text-sky-300" />
              {clock || "--:--:--"}
            </span>
          </div>
        </div>

        <div className="relative mt-6 grid gap-4 md:grid-cols-4">
          <StatCard label="Nodos online" value={`${metrics.onlineNodes}`} icon={Cpu} tone="emerald" />
          <StatCard label="Nodos ocupados" value={`${metrics.busyNodes}`} icon={Activity} tone="amber" />
          <StatCard label="Comandos activos" value={`${metrics.activeCommands}`} icon={Terminal} tone="sky" />
          <StatCard label="Eventos vivos" value={`${metrics.recentEvents}`} icon={Waves} tone="rose" />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.98fr_1.18fr_0.96fr]">
        <section className="hocker-card-float overflow-hidden border-sky-400/10 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="hocker-title-line">Infraestructura</p>
              <h2 className="mt-1 text-lg font-black text-white">Nodos activos</h2>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-slate-300">
              <Layers3 className="h-3.5 w-3.5 text-sky-300" />
              {nodes.length}
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {nodes.length === 0 ? (
              <div className="rounded-[22px] border border-white/5 bg-white/[0.03] px-4 py-6 text-sm text-slate-400">
                Sin nodos cargados todavía.
              </div>
            ) : (
              nodes.map((node) => (
                <article
                  key={node.id}
                  className="group rounded-[24px] border border-white/5 bg-white/[0.03] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-400/20 hover:bg-white/[0.05]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-white">
                        {node.name || node.id}
                      </p>
                      <p className="mt-1 truncate text-[11px] uppercase tracking-[0.22em] text-slate-500">
                        {node.type} · {node.id}
                      </p>
                    </div>

                    <span
                      className={`mt-1 flex h-3.5 w-3.5 shrink-0 rounded-full ${nodeTone(node.status)} shadow-[0_0_18px_rgba(14,165,233,0.2)]`}
                    />
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-slate-500">
                    <span>Estado</span>
                    <span className="text-slate-300">{node.status}</span>
                  </div>

                  <div className="mt-1 flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-slate-500">
                    <span>Última señal</span>
                    <span className="text-slate-300">
                      {node.last_seen_at ? new Date(node.last_seen_at).toLocaleTimeString("es-MX") : "—"}
                    </span>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="hocker-panel-pro relative overflow-hidden border-sky-400/15 p-5 sm:p-6">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(14,165,233,0.14),transparent_55%)]" />
          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="hocker-title-line">NOVA</p>
                <h2 className="mt-1 text-lg font-black text-white">Presencia central</h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
                  La única IA madre oficial del sistema, con logo corporativo y motion
                  como lenguaje principal de marca. Aquí vive el corazón de la experiencia.
                </p>
              </div>

              <IsoPulse />
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[26px] border border-white/5 bg-white/[0.03] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-sky-300">
                  Orquestación
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  NOVA distribuye decisiones, prioriza tareas y mantiene el ecosistema sincronizado.
                </p>
              </div>

              <div className="rounded-[26px] border border-white/5 bg-white/[0.03] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-sky-300">
                  Presencia
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  El centro visual queda listo para avatar, voz, estados y motion logo.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/chat"
                className="hocker-button-brand"
              >
                Abrir NOVA
                <ArrowUpRight className="h-4 w-4" />
              </Link>

              <Link
                href="/commands"
                className="hocker-button-ghost"
              >
                Ir a comandos
              </Link>

              <Link
                href="/nodes"
                className="hocker-button-ghost"
              >
                Ver nodos
              </Link>
            </div>

            <div className="mt-6 rounded-[28px] border border-white/5 bg-slate-950/55 p-4 shadow-[0_20px_80px_rgba(2,6,23,0.3)]">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-400/15 bg-sky-400/10">
                  <Brain className="h-5 w-5 text-sky-300" />
                </div>
                <div>
                  <p className="text-sm font-black text-white">NOVA online</p>
                  <p className="text-xs text-slate-400">Listo para chat, voz y control.</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[20px] border border-white/5 bg-white/[0.03] px-3 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
                    Modo
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">Operativo</p>
                </div>
                <div className="rounded-[20px] border border-white/5 bg-white/[0.03] px-3 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
                    Voz
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">Activa</p>
                </div>
                <div className="rounded-[20px] border border-white/5 bg-white/[0.03] px-3 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
                    Avatar
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">Oficial</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="hocker-card-float overflow-hidden border-sky-400/10 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="hocker-title-line">Ejecución</p>
              <h2 className="mt-1 text-lg font-black text-white">Comandos</h2>
            </div>

            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.24em] text-slate-300">
              <Terminal className="h-3.5 w-3.5 text-sky-300" />
              {commands.length}
            </span>
          </div>

          <div className="mt-5 grid gap-3">
            <button
              type="button"
              onClick={() => void runCommand("restart_nova")}
              disabled={sending}
              className="hocker-button-brand w-full justify-center py-3.5 disabled:opacity-60"
            >
              Reiniciar NOVA
              <RefreshCcw className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => void runCommand("node.sync")}
              disabled={sending}
              className="hocker-button-ghost w-full justify-center py-3.5 disabled:opacity-60"
            >
              Sincronizar nodos
            </button>

            <button
              type="button"
              onClick={() => void runCommand("restart_db")}
              disabled={sending}
              className="hocker-button-ghost w-full justify-center py-3.5 disabled:opacity-60"
            >
              Reiniciar DB
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {commands.length === 0 ? (
              <div className="rounded-[22px] border border-white/5 bg-white/[0.03] px-4 py-6 text-sm text-slate-400">
                Sin comandos recientes.
              </div>
            ) : (
              commands.map((command) => (
                <article
                  key={command.id}
                  className="rounded-[22px] border border-white/5 bg-white/[0.03] p-4 transition-all duration-300 hover:border-sky-400/20 hover:bg-white/[0.05]"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-white">
                        {command.command}
                      </p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-slate-500">
                        {command.node_id}
                      </p>
                    </div>

                    <span
                      className={[
                        "inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em]",
                        commandTone(command.status),
                      ].join(" ")}
                    >
                      {command.status}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-slate-500">
                    <span>Creado</span>
                    <span className="text-slate-300">
                      {new Date(command.created_at).toLocaleString("es-MX")}
                    </span>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="hocker-panel-pro overflow-hidden border-sky-400/10 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="hocker-title-line">Telemetría</p>
            <h2 className="mt-1 text-lg font-black text-white">Flujo vivo</h2>
          </div>
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-slate-300 transition-all hover:bg-white/[0.07]"
          >
            Ir a chat
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-5 max-h-[420px] overflow-auto custom-scrollbar pr-1">
          <div className="space-y-3">
            {events.length === 0 ? (
              <div className="rounded-[22px] border border-white/5 bg-white/[0.03] px-4 py-6 text-sm text-slate-400">
                No hay eventos todavía.
              </div>
            ) : (
              events.map((event) => (
                <article
                  key={event.id}
                  className="rounded-[22px] border border-white/5 bg-white/[0.03] p-4 transition-all duration-300 hover:border-sky-400/20 hover:bg-white/[0.05]"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-black text-white">
                        {event.type}
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-slate-400">
                        {event.message}
                      </p>
                    </div>

                    <span className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-slate-300">
                      {event.level}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-[18px] border border-white/5 bg-slate-950/40 px-3 py-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                        Nodo
                      </p>
                      <p className="mt-1 text-sm text-slate-200">
                        {event.node_id || "—"}
                      </p>
                    </div>
                    <div className="rounded-[18px] border border-white/5 bg-slate-950/40 px-3 py-2">
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">
                        Hora
                      </p>
                      <p className="mt-1 text-sm text-slate-200">
                        {new Date(event.created_at).toLocaleTimeString("es-MX")}
                      </p>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>

      <Hint title="Diseño móvil y PWA">
        La estructura ya está pensada para verse bien en escritorio, celular y app
        instalada.
      </Hint>
    </main>
  );
}
