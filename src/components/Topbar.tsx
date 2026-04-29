"use client";

import Link from "next/link";
import { Bot, ShieldCheck } from "lucide-react";
import { usePathname } from "next/navigation";

const titles: Record<string, string> = {
  "/": "Inicio",
  "/dashboard": "Panel",
  "/chat": "NOVA",
  "/commands": "Tareas",
  "/nodes": "Nodos",
  "/governance": "Guardia",
  "/supply": "Supply",
  "/agis": "AGIs",
};

function getTitle(pathname: string) {
  return titles[pathname] || "Hocker ONE";
}

export default function Topbar() {
  const pathname = usePathname() || "/";
  const title = getTitle(pathname);

  return (
    <header className="fixed inset-x-0 top-0 z-[90] border-b border-white/10 bg-[#030711]/88 px-4 py-3 text-white shadow-[0_18px_70px_rgba(0,0,0,0.22)] backdrop-blur-2xl lg:left-[290px]">
      <div className="mx-auto flex min-h-[56px] w-full max-w-[1800px] items-center justify-between gap-3">
        <Link
          href="/"
          className="flex h-12 w-[142px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035]"
          aria-label="Ir al inicio"
        >
          <img
            src="/brand/hocker-one-logo.png"
            alt="Hocker ONE"
            className="max-h-8 w-[112px] object-contain drop-shadow-[0_0_16px_rgba(85,220,255,0.18)]"
          />
        </Link>

        <div className="hidden min-w-0 flex-1 items-center gap-3 sm:flex">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(34,197,94,0.7)]" />
          <strong className="truncate text-sm font-black tracking-[0.22em] text-slate-100 uppercase">
            {title}
          </strong>
        </div>

        <nav className="flex items-center gap-2" aria-label="Acciones rápidas">
          <Link
            href="/chat"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 text-[10px] font-black uppercase tracking-[0.24em] text-slate-200 transition hover:border-sky-300/30 hover:bg-sky-400/10 hover:text-sky-100"
          >
            <Bot size={16} />
            <span className="hidden sm:inline">NOVA</span>
          </Link>

          <Link
            href="/governance"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 text-[10px] font-black uppercase tracking-[0.24em] text-slate-200 transition hover:border-sky-300/30 hover:bg-sky-400/10 hover:text-sky-100"
          >
            <ShieldCheck size={16} />
            <span className="hidden sm:inline">Guardia</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
