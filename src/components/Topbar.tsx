"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Search, Sparkles, ShieldCheck } from "lucide-react";
import BrandMark from "@/components/BrandMark";
import { useWorkspace } from "@/components/WorkspaceContext";

function getTitle(pathname: string): string {
  if (pathname === "/") return "Inicio";
  if (pathname.startsWith("/dashboard")) return "Dashboard";
  if (pathname.startsWith("/chat")) return "Chat";
  if (pathname.startsWith("/commands")) return "Comandos";
  if (pathname.startsWith("/nodes")) return "Nodos";
  if (pathname.startsWith("/agis")) return "AGIs";
  if (pathname.startsWith("/supply")) return "Supply";
  if (pathname.startsWith("/governance")) return "Guardia";
  return "Hocker ONE";
}

function MiniPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="hidden rounded-full border border-white/6 bg-white/[0.03] px-3 py-2 xl:block">
      <p className="text-[9px] font-black uppercase tracking-[0.34em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-xs font-black text-white">{value}</p>
    </div>
  );
}

export default function Topbar() {
  const pathname = usePathname() || "/";
  const { projectId, nodeId } = useWorkspace();
  const title = getTitle(pathname);

  return (
    <header className="fixed left-0 top-0 z-40 h-[78px] w-full border-b border-white/6 bg-slate-950/60 backdrop-blur-3xl">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(56,189,248,0.08),transparent_24%,transparent_76%,rgba(168,85,247,0.08))]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-sky-400/65 to-transparent" />

      <div className="relative flex h-full items-center gap-3 px-3 sm:px-4 lg:pl-[308px] lg:pr-4">
        <div className="flex items-center gap-3 rounded-[22px] border border-white/6 bg-white/[0.03] px-3 py-2 shadow-[0_10px_40px_rgba(2,6,23,0.18)]">
          <div className="lg:hidden">
            <BrandMark compact showWordmark={false} className="!px-0 !py-0" />
          </div>

          <div className="hidden sm:block">
            <p className="text-[10px] font-black uppercase tracking-[0.34em] text-sky-300">
              {title}
            </p>
            <p className="mt-1 text-xs text-slate-400">lectura clara</p>
          </div>
        </div>

        <div className="hidden min-w-0 flex-1 items-center gap-3 xl:flex">
          <div className="flex min-w-0 flex-1 items-center gap-3 rounded-[22px] border border-white/6 bg-white/[0.03] px-4 py-2 shadow-[0_10px_40px_rgba(2,6,23,0.16)]">
            <Search className="h-4 w-4 shrink-0 text-slate-500" />
            <span className="truncate text-sm text-slate-500">
              Buscar, revisar o entrar directo a operación
            </span>
          </div>

          <MiniPill label="Proyecto" value={projectId} />
          <MiniPill label="Nodo" value={nodeId} />
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/10 px-3 py-2 sm:flex">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[9px] font-black uppercase tracking-[0.34em] text-emerald-200">
              realtime
            </span>
          </div>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/6 bg-white/[0.03] text-slate-300 shadow-[0_10px_40px_rgba(2,6,23,0.18)] transition-all hover:border-sky-400/20 hover:bg-white/[0.06] hover:text-white"
            aria-label="Notificaciones"
          >
            <Bell className="h-4.5 w-4.5" />
          </button>

          <Link href="/chat" className="shell-button-primary hidden sm:inline-flex">
            NOVA
            <Sparkles className="h-4 w-4" />
          </Link>

          <Link href="/governance" className="shell-button-secondary hidden sm:inline-flex">
            Guardia
            <ShieldCheck className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
