"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Map, ShieldCheck, Sparkles } from "lucide-react";
import BrandMark from "@/components/BrandMark";
import { useWorkspace } from "@/components/WorkspaceContext";

function getTitle(pathname: string): string {
  if (pathname === "/") return "Inicio";
  if (pathname.startsWith("/dashboard")) return "Panel";
  if (pathname.startsWith("/chat")) return "NOVA";
  if (pathname.startsWith("/commands")) return "Comandos";
  if (pathname.startsWith("/nodes")) return "Nodos";
  if (pathname.startsWith("/agis")) return "AGIs";
  if (pathname.startsWith("/supply")) return "Supply";
  if (pathname.startsWith("/governance")) return "Guardia";
  return "Hocker ONE";
}

export default function Topbar() {
  const pathname = usePathname() || "/";
  const { projectId } = useWorkspace();
  const title = getTitle(pathname);

  return (
    <header className="fixed left-0 top-0 z-40 h-[76px] w-full border-b border-white/10 bg-[#050816]/72 backdrop-blur-3xl">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(34,211,238,0.10),transparent_30%,transparent_70%,rgba(168,85,247,0.10))]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />

      <div className="relative flex h-full items-center gap-3 px-3 sm:px-4 lg:pl-[300px] lg:pr-5">
        <div className="flex items-center gap-3 rounded-[22px] border border-white/10 bg-white/[0.04] px-3 py-2">
          <div className="lg:hidden">
            <BrandMark compact showWordmark={false} className="!px-0 !py-0" />
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-200">
              {title}
            </p>
            <p className="mt-1 hidden text-xs text-slate-400 sm:block">
              {projectId}
            </p>
          </div>
        </div>

        <div className="hidden min-w-0 flex-1 items-center gap-3 xl:flex">
          <div className="flex min-w-0 flex-1 items-center gap-3 rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3">
            <Map className="h-4 w-4 shrink-0 text-cyan-200" />
            <span className="truncate text-sm text-slate-400">
              Ruta actual: {pathname}
            </span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/10 px-3 py-2 sm:flex">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.8)]" />
            <span className="text-[9px] font-black uppercase tracking-[0.28em] text-emerald-200">
              vivo
            </span>
          </div>

          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:border-cyan-300/30 hover:text-white"
            aria-label="Notificaciones"
          >
            <Bell className="h-5 w-5" />
          </button>

          <Link href="/chat" className="hkr-top-action hidden sm:inline-flex">
            NOVA
            <Sparkles className="h-4 w-4" />
          </Link>

          <Link href="/governance" className="hkr-top-action-soft hidden sm:inline-flex">
            Guardia
            <ShieldCheck className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}

