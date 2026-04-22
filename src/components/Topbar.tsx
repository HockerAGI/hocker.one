"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  Bell,
  CircleDot,
  Search,
  Sparkles,
  Waves,
} from "lucide-react";
import BrandMark from "@/components/BrandMark";
import { useWorkspace } from "@/components/WorkspaceContext";

function TopPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="hidden rounded-full border border-white/5 bg-white/[0.03] px-3 py-2 backdrop-blur-xl sm:block">
      <p className="text-[9px] font-black uppercase tracking-[0.34em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-xs font-semibold text-white">{value}</p>
    </div>
  );
}

function getTitle(pathname: string): string {
  if (pathname === "/") return "Inicio";
  if (pathname.startsWith("/dashboard")) return "Core";
  if (pathname.startsWith("/chat")) return "NOVA";
  if (pathname.startsWith("/commands")) return "Órdenes";
  if (pathname.startsWith("/nodes")) return "Nodos";
  if (pathname.startsWith("/agis")) return "AGIs";
  if (pathname.startsWith("/supply")) return "Supply";
  if (pathname.startsWith("/governance")) return "Guardia";
  return "Hocker ONE";
}

export default function Topbar() {
  const pathname = usePathname() || "/";
  const { projectId, nodeId, tutorial } = useWorkspace();
  const title = getTitle(pathname);

  return (
    <header className="fixed left-0 top-0 z-40 h-[78px] w-full border-b border-white/5 bg-slate-950/55 backdrop-blur-3xl">
      <div className="relative h-full">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(14,165,233,0.08),transparent_24%,transparent_76%,rgba(168,85,247,0.08))]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-sky-400/70 to-transparent" />

        <div className="relative flex h-full items-center gap-3 px-3 sm:px-4 lg:pl-[304px] lg:pr-4">
          <div className="flex items-center gap-3 rounded-[22px] border border-white/5 bg-white/[0.03] px-3 py-2 shadow-[0_10px_40px_rgba(2,6,23,0.18)]">
            <div className="lg:hidden">
              <BrandMark compact showWordmark={false} className="!px-0 !py-0" />
            </div>

            <div className="hidden lg:block">
              <BrandMark compact showWordmark={false} className="!px-0 !py-0" />
            </div>

            <div className="hidden sm:block">
              <p className="text-[9px] font-black uppercase tracking-[0.34em] text-sky-300">
                {title}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Centro de control vivo
              </p>
            </div>
          </div>

          <div className="hidden min-w-0 flex-1 items-center gap-3 xl:flex">
            <div className="flex min-w-0 flex-1 items-center gap-3 rounded-[22px] border border-white/5 bg-white/[0.03] px-4 py-2 shadow-[0_10px_40px_rgba(2,6,23,0.16)]">
              <Search className="h-4 w-4 shrink-0 text-slate-500" />
              <span className="truncate text-sm text-slate-500">
                Busca, ejecuta o entra a NOVA
              </span>
            </div>

            <TopPill label="Proyecto" value={projectId} />
            <TopPill label="Nodo" value={nodeId} />

            <div className="rounded-full border border-emerald-400/15 bg-emerald-400/10 px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70 animate-ping" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </span>
                <span className="text-[9px] font-black uppercase tracking-[0.34em] text-emerald-200">
                  Realtime
                </span>
              </div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-white/5 bg-white/[0.03] px-3 py-2 xl:flex">
              <CircleDot className="h-4 w-4 text-sky-300" />
              <span className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-300">
                {tutorial ? "Guía activa" : "Modo libre"}
              </span>
            </div>

            <div className="hidden items-center gap-2 rounded-full border border-white/5 bg-white/[0.03] px-3 py-2 sm:flex">
              <Waves className="h-4 w-4 text-sky-300" />
              <span className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-300">
                Sistema vivo
              </span>
            </div>

            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/5 bg-white/[0.03] text-slate-300 shadow-[0_10px_40px_rgba(2,6,23,0.18)] transition-all hover:border-sky-400/20 hover:bg-white/[0.06] hover:text-white"
              aria-label="Notificaciones"
            >
              <Bell className="h-4.5 w-4.5" />
            </button>

            <Link
              href="/chat"
              className="inline-flex items-center gap-2 rounded-2xl border border-sky-400/15 bg-sky-400/10 px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.34em] text-sky-200 shadow-[0_0_30px_rgba(14,165,233,0.12)] transition-all hover:-translate-y-0.5 hover:border-sky-300/30 hover:bg-sky-400/15"
            >
              NOVA
              <Sparkles className="h-4 w-4" />
            </Link>

            <Link
              href="/dashboard"
              className="hidden items-center gap-2 rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.34em] text-slate-200 transition-all hover:bg-white/[0.06] sm:inline-flex"
            >
              Core
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}