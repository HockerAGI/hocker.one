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
  Sparkles,
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
];

function SignalPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3 backdrop-blur-md">
      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-1 truncate text-[11px] font-bold text-slate-200">{value}</p>
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname() || "/";
  const { projectId, nodeId } = useWorkspace();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 hidden w-[292px] flex-col border-r border-white/5 bg-slate-950/50 backdrop-blur-3xl lg:flex">
      <div className="flex h-[94px] items-center px-8">
        <BrandMark className="h-9 w-auto" />
      </div>

      <nav className="custom-scrollbar flex-1 overflow-y-auto px-5 py-6">
        <div className="space-y-10">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="mb-4 px-3 text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
                {group.title}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={[
                        "group flex items-center gap-4 rounded-2xl px-4 py-3.5 transition-all duration-300",
                        active
                          ? "border border-sky-400/20 bg-sky-400/10 text-white shadow-[0_10px_30px_rgba(14,165,233,0.12)]"
                          : "border border-transparent text-slate-400 hover:bg-white/[0.04] hover:text-slate-200",
                      ].join(" ")}
                    >
                      <Icon className={["h-5 w-5", active ? "text-sky-300" : "text-slate-500 group-hover:text-slate-300"].join(" ")} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold tracking-tight">{item.label}</p>
                        <p className="truncate text-[10px] opacity-60">{item.hint}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div className="mt-auto border-t border-white/5 bg-slate-950/40 px-5 py-6 backdrop-blur-md">
        <div className="mb-5 grid grid-cols-2 gap-3">
          <SignalPill label="ESPACIO" value={projectId} />
          <SignalPill label="ESTACIÓN" value={nodeId} />
        </div>
        <Link
          href="/chat"
          className="relative flex items-center justify-between overflow-hidden rounded-2xl border border-sky-500/20 bg-sky-500/10 p-4 transition-all hover:border-sky-400/30 hover:bg-sky-500/15"
        >
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-300">Abrir NOVA</p>
            <p className="mt-1 text-xs font-semibold text-sky-100/90">Gestión inteligente</p>
          </div>
          <ArrowUpRight className="h-4 w-4 text-sky-300" />
        </Link>
      </div>
    </aside>
  );
}