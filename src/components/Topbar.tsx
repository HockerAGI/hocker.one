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
    <header className="fixed inset-x-0 top-0 z-[90] hidden border-b border-white/10 bg-[#030711] px-4 py-3 text-white lg:left-[290px] lg:block">
      <div className="mx-auto flex min-h-[56px] w-full max-w-[1800px] items-center justify-between gap-3">
        <Link
          href="/"
          className="flex h-12 w-[142px] items-center justify-center rounded-2xl border border-white/10 bg-[#07101f]"
          aria-label="Ir al inicio"
        >
          <img
            src="/brand/hocker-one-logo.png"
            alt="Hocker ONE"
            className="max-h-8 w-[112px] object-contain"
          />
        </Link>

        <div className="min-w-0 flex-1 items-center gap-3 lg:flex">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
          <strong className="truncate text-sm font-black uppercase tracking-[0.22em] text-slate-100">
            {title}
          </strong>
        </div>

        <nav className="flex items-center gap-2" aria-label="Acciones rápidas">
          <Link
            href="/chat"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-[#0b1526] px-3 text-[10px] font-black uppercase tracking-[0.24em] text-slate-200"
          >
            <Bot size={16} />
            <span>NOVA</span>
          </Link>

          <Link
            href="/governance"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-[#0b1526] px-3 text-[10px] font-black uppercase tracking-[0.24em] text-slate-200"
          >
            <ShieldCheck size={16} />
            <span>Guardia</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
