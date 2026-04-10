"use client";

import { Activity, CircleDot, ShieldCheck, Waves } from "lucide-react";

type SystemStatusTone = "online" | "connecting" | "warning" | "offline" | "error";

type SystemStatusProps = {
  title?: string;
  subtitle?: string;
  tone?: SystemStatusTone;
  updatedAt?: string;
  projectId?: string;
  nodeId?: string;
  className?: string;
};

const toneStyles: Record<SystemStatusTone, { pill: string; glow: string; label: string }> = {
  online: {
    pill: "border-emerald-400/15 bg-emerald-400/10 text-emerald-200",
    glow: "bg-emerald-400/20",
    label: "Online",
  },
  connecting: {
    pill: "border-sky-400/15 bg-sky-400/10 text-sky-200",
    glow: "bg-sky-400/20",
    label: "Conectando",
  },
  warning: {
    pill: "border-amber-400/15 bg-amber-400/10 text-amber-200",
    glow: "bg-amber-400/20",
    label: "Advertencia",
  },
  offline: {
    pill: "border-slate-400/15 bg-slate-400/10 text-slate-200",
    glow: "bg-slate-400/20",
    label: "Offline",
  },
  error: {
    pill: "border-rose-400/15 bg-rose-400/10 text-rose-200",
    glow: "bg-rose-400/20",
    label: "Error",
  },
};

export default function SystemStatus({
  title = "Estado global",
  subtitle = "Sistema vivo",
  tone = "connecting",
  updatedAt,
  projectId,
  nodeId,
  className = "",
}: SystemStatusProps) {
  const t = toneStyles[tone];

  return (
    <section
      className={[
        "hocker-panel-pro relative overflow-hidden border p-4 sm:p-5",
        className,
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.08),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-sky-400/70 to-transparent" />

      <div className="relative flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="hocker-title-line">{title}</p>
            <h3 className="mt-2 text-lg font-black tracking-tight text-white">
              {subtitle}
            </h3>
          </div>

          <div className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.32em]">
            <span className={["h-2.5 w-2.5 rounded-full", t.glow, "shadow-[0_0_18px_rgba(14,165,233,0.35)]"].join(" ")} />
            <span className={t.pill.split(" ").slice(-1)[0]}>{t.label}</span>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[22px] border border-white/5 bg-white/[0.03] px-3 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
              Proyecto
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-white">
              {projectId || "hocker-one"}
            </p>
          </div>

          <div className="rounded-[22px] border border-white/5 bg-white/[0.03] px-3 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
              Nodo
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-white">
              {nodeId || "hocker-agi"}
            </p>
          </div>

          <div className="rounded-[22px] border border-white/5 bg-white/[0.03] px-3 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
              Actualizado
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-white">
              {updatedAt || "en vivo"}
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-[22px] border border-white/5 bg-slate-950/45 px-3 py-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-sky-300" />
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">
                Telemetría
              </p>
            </div>
            <p className="mt-2 text-sm text-slate-200">Señal continua</p>
          </div>

          <div className="rounded-[22px] border border-white/5 bg-slate-950/45 px-3 py-3">
            <div className="flex items-center gap-2">
              <Waves className="h-4 w-4 text-sky-300" />
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">
                Flujo
              </p>
            </div>
            <p className="mt-2 text-sm text-slate-200">Realtime activo</p>
          </div>

          <div className="rounded-[22px] border border-white/5 bg-slate-950/45 px-3 py-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-sky-300" />
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">
                Seguridad
              </p>
            </div>
            <p className="mt-2 text-sm text-slate-200">Controlado</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
          <CircleDot className="h-3.5 w-3.5 text-sky-300" />
          <span>Hocker One opera en modo sistema.</span>
        </div>
      </div>
    </section>
  );
}
