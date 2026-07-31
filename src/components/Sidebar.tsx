"use client";

import Link from "next/link";
import {
  Activity,
  Bell,
  Bot,
  Brain,
  CheckSquare,
  ChevronRight,
  CircleDot,
  Dices,
  Grid2X2,
  Home,
  Landmark,
  Map,
  Network,
  Package,
  Plug,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useEffect, useState } from "react";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Home;
  badge?: string;
  dot?: "green" | "amber" | "red";
};
type NavGroup = { title: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    title: "Núcleo",
    items: [
      { href: "/owner", label: "Inicio", icon: Home },
      { href: "/catalog", label: "Buscar en el ecosistema", icon: Search },
      { href: "/map", label: "Mapa del ecosistema", icon: Map },
      { href: "/live", label: "Operación en vivo", icon: Activity, dot: "green" },
      { href: "/chat", label: "NOVA Chat", icon: Bot, dot: "green" },
    ],
  },
  {
    title: "Operación",
    items: [
      { href: "/commands", label: "Tareas y aprobaciones", icon: CheckSquare },
      { href: "/nodes", label: "Nodos y agentes", icon: Network },
      { href: "/status", label: "Salud del sistema", icon: CircleDot },
    ],
  },
  {
    title: "Ecosistema",
    items: [
      { href: "/apps", label: "Apps", icon: Grid2X2 },
      { href: "/agis", label: "AGIs y funciones", icon: Sparkles },
      { href: "/integrations", label: "Herramientas y APIs", icon: Plug },
      { href: "/memory", label: "Memoria y aprendizaje", icon: Brain },
      { href: "/supply", label: "Supply", icon: Package },
      { href: "/chido", label: "Chido Casino", icon: Dices, dot: "amber" },
    ],
  },
  {
    title: "Gobernanza",
    items: [
      { href: "/security", label: "Seguridad", icon: ShieldCheck },
      { href: "/governance", label: "Reglas y gobierno", icon: Landmark },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/owner") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar() {
  const pathname = usePathname() || "/";
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const res = await fetch("/api/agi/runtime/actions?status=needs_approval", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json() as { actions?: unknown[] };
          setPendingCount(Array.isArray(data.actions) ? data.actions.length : 0);
        }
      } catch {
        // El menú no debe bloquear la navegación si el contador no responde.
      }
    };
    void fetchPending();
    const id = setInterval(() => { void fetchPending(); }, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <aside
      className="hko-sidebar fixed left-3 top-3 z-[95] hidden h-[calc(100dvh-1.5rem)] w-[264px] flex-col overflow-hidden rounded-[28px] border border-white/[0.07] bg-[#050d1a]/90 text-white shadow-[0_32px_80px_rgba(0,0,0,0.5)] backdrop-blur-3xl lg:flex"
      aria-label="Menú lateral"
    >
      <Link
        href="/owner"
        className="mx-3 mt-3 flex h-[64px] shrink-0 items-center justify-center rounded-[20px] border border-white/[0.07] bg-white/[0.03] transition-colors hover:bg-white/[0.05]"
        aria-label="Inicio privado"
      >
        <Image
          src="/brand/hocker-one-logo.png"
          alt="Hocker ONE"
          className="max-h-10 w-[152px] object-contain drop-shadow-[0_0_20px_rgba(85,220,255,0.2)]"
          width={152}
          height={40}
        />
      </Link>

      {pendingCount > 0 && (
        <Link
          href="/chat"
          className="mx-3 mt-2.5 flex items-center gap-2.5 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-3.5 py-2.5 transition-colors hover:bg-amber-400/15"
        >
          <Bell className="h-3.5 w-3.5 shrink-0 text-amber-300" />
          <span className="flex-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-200">
            {pendingCount} aprobación{pendingCount !== 1 ? "es" : ""} pendiente{pendingCount !== 1 ? "s" : ""}
          </span>
          <ChevronRight className="h-3 w-3 text-amber-400/60" />
        </Link>
      )}

      <nav
        className="mt-3 flex-1 overflow-y-auto px-3 pb-2 hko-sidebar-scroll"
        aria-label="Navegación principal"
      >
        {navGroups.map((group) => (
          <div key={group.title} className="mb-3">
            <p className="mb-1.5 px-2 text-[8.5px] font-black uppercase tracking-[0.28em] text-slate-600">
              {group.title}
            </p>
            <div className="grid gap-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.href);
                const showPendingBadge = item.href === "/commands" && pendingCount > 0;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      "group flex min-h-[42px] items-center gap-3 rounded-[14px] border px-3.5 transition-all duration-150",
                      active
                        ? "border-sky-400/20 bg-gradient-to-r from-sky-400/10 to-sky-500/5 text-sky-100 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.08)]"
                        : "border-transparent text-slate-500 hover:border-white/[0.06] hover:bg-white/[0.035] hover:text-slate-200",
                    ].join(" ")}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon
                      size={15}
                      className={active ? "text-sky-300" : "text-slate-600 group-hover:text-slate-400"}
                    />
                    <span className={[
                      "flex-1 text-[12px] tracking-[0.01em]",
                      active ? "font-bold text-sky-100" : "font-semibold",
                    ].join(" ")}>
                      {item.label}
                    </span>

                    {item.dot && !active && (
                      <span className={[
                        "h-1.5 w-1.5 shrink-0 rounded-full",
                        item.dot === "green" ? "bg-emerald-400" : item.dot === "amber" ? "bg-amber-400" : "bg-red-400",
                      ].join(" ")} />
                    )}

                    {showPendingBadge && (
                      <span className="flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-amber-400 px-1.5 text-[9px] font-black text-black">
                        {pendingCount}
                      </span>
                    )}

                    {active && (
                      <ChevronRight size={12} className="shrink-0 text-sky-400/50" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mx-3 mb-3 shrink-0 overflow-hidden rounded-[18px] border border-sky-400/12 bg-gradient-to-b from-sky-400/8 to-transparent">
        <Link href="/chat" className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-sky-400/5">
          <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-400/15">
            <Bot size={16} className="text-sky-300" />
            <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#050d1a] bg-emerald-400" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-200">NOVA</p>
            <p className="truncate text-[10px] font-medium text-slate-500">Activa · Abrir chat y aprobaciones</p>
          </div>
          <ChevronRight size={12} className="shrink-0 text-sky-400/40" />
        </Link>
      </div>
    </aside>
  );
}
