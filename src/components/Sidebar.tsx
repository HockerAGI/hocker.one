"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Brain,
  Command,
  Cpu,
  Orbit,
  Workflow,
  ShieldCheck,
  Sparkles,
  MoveRight,
  Zap,
  Waves,
  MessagesSquare,
  ArrowUpRight,
} from "lucide-react";
import BrandMark from "@/components/BrandMark";
import { useWorkspace } from "@/components/WorkspaceContext";

type NavItem = {
  href: string;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Principal",
    items: [
      { href: "/dashboard", label: "Centro", hint: "Vista general", icon: LayoutDashboard },
      { href: "/chat", label: "NOVA", hint: "Habla con NOVA", icon: Brain },
      { href: "/commands", label: "Tareas", hint: "Pendientes y lista", icon: Command },
    ],
  },
  {
    title: "Operación",
    items: [
      { href: "/nodes", label: "Equipo", hint: "Conexiones vivas", icon: Cpu },
      { href: "/agis", label: "Asistentes", hint: "Unidades del sistema", icon: Orbit },
      { href: "/supply", label: "Tienda", hint: "Productos y pedidos", icon: Workflow },
    ],
  },
  {
    title: "Seguridad",
    items: [
      { href: "/governance", label: "Seguridad", hint: "Control y permisos", icon: ShieldCheck },
      { href: "/", label: "Portada", hint: "Volver al inicio", icon: Sparkles },
    ],
  },
];

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function SignalPill({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[20px] border border-white/5 bg-white/[0.03] px-3 py-2.5 shadow-[0_10px_40px_rgba(2,6,23,0.16)]">
      <p className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname() || "/";
  const { projectId, nodeId, tutorial } = useWorkspace();

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[292px] lg:block">
      <div className="relative flex h-full w-full flex-col overflow-hidden border-r border-white/5 bg-slate-950/72 backdrop-blur-3xl shadow-[20px_0_80px_rgba(2,6,23,0.35)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.14),transparent_35%),radial-gradient(circle_at_bottom,rgba(168,85,247,0.08),transparent_28%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-sky-400/80 to-transparent" />

        <div className="relative flex items-center justify-between gap-3 px-5 py-5">
          <BrandMark compact className="!px-0 !py-0" />

          <div className="flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/10 px-3 py-1.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70 animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </span>
            <span className="text-[9px] font-black uppercase tracking-[0.28em] text-emerald-200">
              En línea
            </span>
          </div>
        </div>

        <div className="relative px-4">
          <div className="rounded-[28px] border border-white/5 bg-white/[0.03] p-4 shadow-[0_14px_50px_rgba(2,6,23,0.18)]">
            <p className="text-[10px] font-black uppercase tracking-[0.34em] text-sky-300">
              Hocker ONE
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              Un centro visual, claro y directo para hablar con NOVA, revisar tareas y mover la operación.
            </p>

            <div className="mt-4 flex items-center gap-2 rounded-full border border-white/5 bg-slate-950/50 px-3 py-2">
              <Waves className="h-4 w-4 text-sky-300" />
              <span className="text-[10px] font-black uppercase tracking-[0.28em] text-slate-300">
                {tutorial ? "Guía activa" : "Modo libre"}
              </span>
            </div>
          </div>
        </div>

        <nav className="custom-scrollbar relative flex-1 overflow-y-auto px-4 py-4">
          <div className="space-y-4">
            {NAV_GROUPS.map((group) => (
              <div key={group.title} className="space-y-2">
                <p className="px-2 text-[10px] font-black uppercase tracking-[0.36em] text-slate-500">
                  {group.title}
                </p>

                <div className="space-y-1">
                  {group.items.map((item) => {
                    const active = isActivePath(pathname, item.href);
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "group relative flex items-center gap-3.5 rounded-2xl px-4 py-3.5 transition-all duration-300",
                          active
                            ? "bg-white/[0.05] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_10px_40px_rgba(2,6,23,0.15)]"
                            : "hover:bg-white/[0.025]",
                        )}
                      >
                        {active ? (
                          <div className="absolute inset-y-0 left-0 w-[3px] rounded-r-full bg-gradient-to-b from-sky-400 to-indigo-500 shadow-[0_0_15px_rgba(56,189,248,0.6)]" />
                        ) : null}

                        <div
                          className={cn(
                            "relative flex items-center justify-center transition-transform duration-300",
                            active ? "scale-110" : "group-hover:scale-110",
                          )}
                        >
                          <div
                            className={cn(
                              "absolute inset-0 rounded-full blur-md transition-opacity duration-300",
                              active ? "bg-sky-400/35 opacity-100" : "bg-white/20 opacity-0 group-hover:opacity-100",
                            )}
                          />
                          <Icon
                            className={cn(
                              "relative z-10 h-[18px] w-[18px] transition-colors duration-300",
                              active
                                ? "text-sky-300 drop-shadow-[0_0_8px_rgba(125,211,252,0.8)]"
                                : "text-slate-400 group-hover:text-slate-200",
                            )}
                          />
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col">
                          <span
                            className={cn(
                              "text-sm font-semibold tracking-wide transition-colors duration-300",
                              active ? "text-white" : "text-slate-300 group-hover:text-white",
                            )}
                          >
                            {item.label}
                          </span>
                          <span
                            className={cn(
                              "text-[10px] font-medium uppercase tracking-wider transition-colors duration-300",
                              active ? "text-sky-300" : "text-slate-500",
                            )}
                          >
                            {item.hint}
                          </span>
                        </div>

                        <MoveRight className={cn(
                          "h-4 w-4 text-sky-400/50 opacity-0 transition-all duration-300",
                          active ? "opacity-60" : "group-hover:translate-x-1 group-hover:opacity-100",
                        )} />
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        <div className="relative mt-auto border-t border-white/5 bg-slate-950/40 px-5 py-6 backdrop-blur-md">
          <div className="mb-5 grid grid-cols-2 gap-3">
            <SignalPill label="ESPACIO" value={projectId} />
            <SignalPill label="ESTACIÓN" value={nodeId} />
          </div>

          <Link
            href="/chat"
            className="relative flex items-center justify-between overflow-hidden rounded-2xl border border-sky-500/20 bg-sky-500/10 p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] transition-all hover:border-sky-400/30 hover:bg-sky-500/15"
          >
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-sky-500/10 to-transparent" />
            <div className="relative z-10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-300">
                Abrir NOVA
              </p>
              <p className="mt-1 text-xs font-semibold text-sky-100/90">
                Chat, archivos y acciones rápidas
              </p>
            </div>
            <ArrowUpRight className="relative z-10 h-5 w-5 text-sky-200" />
          </Link>
        </div>
      </div>
    </aside>
  );
}

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}