"use client";

import { Cpu, TriangleAlert } from "lucide-react";
import type { NodeRow } from "@/lib/types";

type NodeBadgeProps = {
  node: NodeRow;
  compact?: boolean;
  className?: string;
};

const statusTone: Record<string, string> = {
  online: "border-emerald-400/15 bg-emerald-400/10 text-emerald-200",
  busy: "border-amber-400/15 bg-amber-400/10 text-amber-200",
  warning: "border-yellow-400/15 bg-yellow-400/10 text-yellow-200",
  error: "border-rose-400/15 bg-rose-400/10 text-rose-200",
  offline: "border-slate-400/15 bg-slate-400/10 text-slate-200",
  idle: "border-sky-400/15 bg-sky-400/10 text-sky-200",
};

const dotTone: Record<string, string> = {
  online: "bg-emerald-400",
  busy: "bg-amber-400",
  warning: "bg-yellow-400",
  error: "bg-rose-400",
  offline: "bg-slate-500",
  idle: "bg-sky-400",
};

export default function NodeBadge({ node, compact = false, className = "" }: NodeBadgeProps) {
  const tone = statusTone[node.status] ?? statusTone.offline;
  const dot = dotTone[node.status] ?? dotTone.offline;

  return (
    <article
      className={[
        "hocker-card-float relative overflow-hidden border p-4 transition-all duration-300 hover:-translate-y-0.5",
        className,
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.10),transparent_34%)]" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/55">
              <Cpu className="h-4.5 w-4.5 text-sky-300" />
            </span>

            <div className="min-w-0">
              <p className="text-sm font-black text-white">
                {node.name || node.id}
              </p>
              <p className="truncate text-[10px] uppercase tracking-[0.26em] text-slate-500">
                {node.type} · {node.id}
              </p>
            </div>
          </div>

          {!compact ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <div className="rounded-[18px] border border-white/5 bg-white/[0.03] px-3 py-2.5">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
                  Estado
                </p>
                <p className="mt-1 text-sm font-semibold text-white">{node.status}</p>
              </div>

              <div className="rounded-[18px] border border-white/5 bg-white/[0.03] px-3 py-2.5">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
                  Última señal
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {node.last_seen_at ? new Date(node.last_seen_at).toLocaleTimeString("es-MX") : "—"}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <div className={["inline-flex rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.28em]", tone].join(" ")}>
          <span className={["mr-2 mt-[2px] h-2.5 w-2.5 rounded-full", dot].join(" ")} />
          {node.status}
        </div>
      </div>

      {node.status === "error" ? (
        <div className="relative mt-4 flex items-center gap-2 rounded-[18px] border border-rose-400/15 bg-rose-400/10 px-3 py-2 text-xs text-rose-100">
          <TriangleAlert className="h-4 w-4" />
          Nodo con alerta activa.
        </div>
      ) : null}
    </article>
  );
}
