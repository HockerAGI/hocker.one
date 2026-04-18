"use client";

import Link from "next/link";
import { ArrowUpRight, Bot, Cpu, Sparkles, Waves } from "lucide-react";
import { useWorkspace } from "@/components/WorkspaceContext";
import { cn } from "@/lib/cn";

type WorkspaceBarProps = {
  className?: string;
};

function StatusBadge({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string;
  tone?: "slate" | "sky" | "emerald" | "violet";
}) {
  const toneClass =
    tone === "sky"
      ? "border-sky-400/15 bg-sky-400/10 text-sky-200"
      : tone === "emerald"
        ? "border-emerald-400/15 bg-emerald-400/10 text-emerald-200"
        : tone === "violet"
          ? "border-violet-400/15 bg-violet-400/10 text-violet-200"
          : "border-white/5 bg-white/[0.03] text-slate-200";

  return (
    <div className={cn("rounded-[20px] border px-3 py-2.5 backdrop-blur-2xl", toneClass)}>
      <p className="text-[9px] font-black uppercase tracking-[0.34em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-inherit">{value}</p>
    </div>
  );
}

export default function WorkspaceBar({ className = "" }: WorkspaceBarProps) {
  const { projectId, nodeId, tutorial, ready } = useWorkspace();

  return (
    <section
      className={cn(
        "rounded-[30px] border border-white/5 bg-white/[0.03] p-4 shadow-[0_20px_80px_rgba(2,6,23,0.22)] backdrop-blur-2xl",
        className,
      )}
    >
      <div className="relative overflow-hidden rounded-[24px] border border-white/5 bg-slate-950/40 p-4 sm:p-5">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.10),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.07),transparent_26%)]" />

        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-400/15 bg-sky-400/10 px-3 py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-sky-300" />
              <span className="text-[9px] font-black uppercase tracking-[0.34em] text-sky-200">
                Hocker ONE
              </span>
            </div>

            <h1 className="mt-3 text-2xl font-black tracking-tight text-white sm:text-3xl">
              Un espacio claro para operar con NOVA
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
              Aquí ves el estado del proyecto, la estación activa y el acceso rápido a la conversación y las tareas.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <StatusBadge
              label="Estado"
              value={ready ? "Listo para usar" : "Cargando"}
              tone={ready ? "emerald" : "sky"}
            />
            <StatusBadge label="Proyecto" value={projectId} tone="sky" />
            <StatusBadge label="Estación" value={nodeId} tone="violet" />
            <StatusBadge label="Guía" value={tutorial ? "Activa" : "Libre"} />
          </div>
        </div>

        <div className="relative mt-4 grid gap-3 md:grid-cols-3">
          <Link
            href="/chat"
            className="group rounded-[22px] border border-sky-400/15 bg-sky-400/10 p-4 transition-all hover:-translate-y-0.5 hover:border-sky-400/30 hover:bg-sky-400/15"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.32em] text-sky-300">
                  Chat
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-100">
                  Abre NOVA y empieza a escribir
                </p>
              </div>
              <Bot className="h-5 w-5 text-sky-300" />
            </div>
          </Link>

          <Link
            href="/commands"
            className="group rounded-[22px] border border-white/5 bg-white/[0.03] p-4 transition-all hover:-translate-y-0.5 hover:border-white/10 hover:bg-white/[0.05]"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.32em] text-slate-400">
                  Tareas
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-100">
                  Revisa la cola operativa
                </p>
              </div>
              <Cpu className="h-5 w-5 text-slate-300" />
            </div>
          </Link>

          <Link
            href="/dashboard"
            className="group rounded-[22px] border border-white/5 bg-white/[0.03] p-4 transition-all hover:-translate-y-0.5 hover:border-white/10 hover:bg-white/[0.05]"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.32em] text-slate-400">
                  Centro
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-100">
                  Vuelve al panel principal
                </p>
              </div>
              <ArrowUpRight className="h-5 w-5 text-slate-300" />
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}