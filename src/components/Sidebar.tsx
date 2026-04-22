"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  Boxes,
  Cpu,
  LayoutDashboard,
  ShieldCheck,
  ShoppingBag,
  TerminalSquare,
} from "lucide-react";
import BrandMark from "@/components/BrandMark";
import { useWorkspace } from "@/components/WorkspaceContext";
import { cn } from "@/lib/cn";

type NavItem = {
  href: string;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
};

const PRIMARY_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Inicio", hint: "Resumen ejecutivo", icon: LayoutDashboard },
  { href: "/chat", label: "NOVA", hint: "Asistente central", icon: Bot },
  { href: "/commands", label: "Operaciones", hint: "Cola y aprobaciones", icon: TerminalSquare },
  { href: "/nodes", label: "Nodos", hint: "Infraestructura", icon: Cpu },
  { href: "/governance", label: "Control", hint: "Seguridad y reglas", icon: ShieldCheck },
];

const SECONDARY_ITEMS: NavItem[] = [
  { href: "/agis", label: "AGIs", hint: "Unidades del sistema", icon: Boxes },
  { href: "/supply", label: "Supply", hint: "Operación comercial", icon: ShoppingBag },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function TinySignal({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="shell-card px-3 py-3">
      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname() || "/";
  const { projectId, nodeId, tutorial } = useWorkspace();

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[304px] lg:block">
      <div className="flex h-full flex-col border-r border-white/5 bg-slate-950/72 px-4 py-4 backdrop-blur-3xl">
        <div className="rounded-[28px] border border-white/5 bg-white/[0.03] px-4 py-4">
          <BrandMark compact={false} showWordmark className="!px-0 !py-0 !border-0 !bg-transparent !shadow-none" />

          <div className="mt-4 rounded-[22px] border border-sky-400/12 bg-sky-400/8 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-sky-300">Centro de control</p>
            <p className="mt-2 text-sm text-slate-200">
              Todo el ecosistema desde una sola superficie clara.
            </p>
          </div>
        </div>

        <div className="mt-4 flex-1 overflow-y-auto pr-1 hide-scrollbar">
          <div className="space-y-6">
            <div>
              <p className="px-3 text-[10px] font-black uppercase tracking-[0.32em] text-slate-500">
                Principal
              </p>
              <div className="mt-3 space-y-1">
                {PRIMARY_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(pathname, item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-[22px] px-4 py-3 transition-all",
                        active
                          ? "border border-sky-400/15 bg-sky-400/10"
                          : "border border-transparent hover:border-white/5 hover:bg-white/[0.04]",
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-2xl border transition-all",
                          active
                            ? "border-sky-400/20 bg-sky-400/10 text-sky-200"
                            : "border-white/5 bg-white/[0.03] text-slate-400 group-hover:text-white",
                        )}
                      >
                        <Icon className="h-4.5 w-4.5" />
                      </div>

                      <div className="min-w-0">
                        <p className={cn("text-sm font-bold", active ? "text-white" : "text-slate-200")}>
                          {item.label}
                        </p>
                        <p className="text-xs text-slate-500">{item.hint}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="px-3 text-[10px] font-black uppercase tracking-[0.32em] text-slate-500">
                Ecosistema
              </p>
              <div className="mt-3 space-y-1">
                {SECONDARY_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(pathname, item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "group flex items-center gap-3 rounded-[22px] px-4 py-3 transition-all",
                        active
                          ? "border border-sky-400/15 bg-sky-400/10"
                          : "border border-transparent hover:border-white/5 hover:bg-white/[0.04]",
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-2xl border transition-all",
                          active
                            ? "border-sky-400/20 bg-sky-400/10 text-sky-200"
                            : "border-white/5 bg-white/[0.03] text-slate-400 group-hover:text-white",
                        )}
                      >
                        <Icon className="h-4.5 w-4.5" />
                      </div>

                      <div className="min-w-0">
                        <p className={cn("text-sm font-bold", active ? "text-white" : "text-slate-200")}>
                          {item.label}
                        </p>
                        <p className="text-xs text-slate-500">{item.hint}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <TinySignal label="Proyecto" value={projectId} />
            <TinySignal label="Nodo" value={nodeId} />
          </div>

          <div className="rounded-[24px] border border-white/5 bg-white/[0.03] px-4 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
                  Modo de uso
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {tutorial ? "Guiado" : "Experto"}
                </p>
              </div>

              <span className={tutorial ? "shell-chip-brand" : "shell-chip"}>
                {tutorial ? "Simple" : "Avanzado"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}