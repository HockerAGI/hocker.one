"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import WorkspaceBar from "@/components/WorkspaceBar";
import NodeBadge from "@/components/NodeBadge";

const items = [
  { href: "/dashboard", label: "Panel" },
  { href: "/chat", label: "Chat NOVA" },
  { href: "/commands", label: "Acciones" },
  { href: "/nodes", label: "Nodos" },
  { href: "/agis", label: "Agentes IA" },
  { href: "/supply", label: "Supply" },
  { href: "/governance", label: "Seguridad" },
];

export default function AppNav() {
  const pathname = usePathname() || "/";

  return (
    <div className="sticky top-0 z-50 border-b border-slate-200 bg-white/85 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white font-extrabold">
                H
              </div>
              <div className="leading-tight">
                <div className="text-sm font-extrabold tracking-tight">HOCKER ONE</div>
                <div className="text-[11px] text-slate-500">Control Plane</div>
              </div>
            </Link>

            <NodeBadge />
          </div>

          <WorkspaceBar />

          <nav className="flex flex-wrap gap-2">
            {items.map((it) => {
              const active = pathname === it.href || pathname.startsWith(it.href + "/");
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={
                    "rounded-xl px-3 py-2 text-sm font-semibold transition-colors " +
                    (active ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50")
                  }
                >
                  {it.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
