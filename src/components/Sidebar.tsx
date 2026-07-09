"use client";

import Link from "next/link";
import {
  Activity,
  Bot,
  CheckSquare,
  CircleDot,
  Grid2X2,
  Home,
  Map,
  ShieldCheck,
  Sparkles,
  Network,
  Database,
  Plug,
  Brain,
  Package,
  Dices,
  Landmark,
} from "lucide-react";
import { usePathname } from "next/navigation";
import Image from "next/image";

type NavItem = { href: string; label: string; icon: typeof Home };
type NavGroup = { title: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    title: "Núcleo",
    items: [
      { href: "/owner", label: "Inicio", icon: Home },
      { href: "/map", label: "Mapa", icon: Map },
      { href: "/live", label: "Sistema en vivo", icon: Activity },
      { href: "/chat", label: "NOVA", icon: Bot },
    ],
  },
  {
    title: "Operación",
    items: [
      { href: "/commands", label: "Tareas", icon: CheckSquare },
      { href: "/nodes", label: "Nodos", icon: Network },
      { href: "/status", label: "Estado", icon: CircleDot },
    ],
  },
  {
    title: "Ecosistema",
    items: [
      { href: "/apps", label: "Apps", icon: Grid2X2 },
      { href: "/agis", label: "AGIs", icon: Sparkles },
      { href: "/integrations", label: "Integraciones", icon: Plug },
      { href: "/memory", label: "Memoria IA", icon: Brain },
      { href: "/supply", label: "Supply", icon: Package },
      { href: "/chido", label: "Chido Casino", icon: Dices },
    ],
  },
  {
    title: "Gobernanza",
    items: [
      { href: "/security", label: "Seguridad", icon: ShieldCheck },
      { href: "/governance", label: "Gobierno", icon: Landmark },
    ],
  },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar() {
  const pathname = usePathname() || "/";

  return (
    <aside
      className="fixed left-4 top-4 z-[95] hidden h-[calc(100dvh-2rem)] w-[258px] flex-col overflow-hidden rounded-[34px] border border-white/10 bg-slate-950/72 p-4 text-white shadow-[0_30px_110px_rgba(0,0,0,0.36)] backdrop-blur-2xl lg:flex"
      aria-label="Menú lateral"
    >
      <Link
        href="/owner"
        className="flex h-[74px] shrink-0 items-center justify-center rounded-[26px] border border-white/10 bg-white/[0.035]"
        aria-label="Inicio privado"
      >
        <Image
          src="/brand/hocker-one-logo.png"
          alt="Hocker ONE"
          className="max-h-12 w-[170px] object-contain drop-shadow-[0_0_18px_rgba(85,220,255,0.18)]"
         />
      </Link>

      <nav className="mt-4 flex-1 overflow-y-auto pr-1 hko-sidebar-scroll" aria-label="Navegación principal">
        {navGroups.map((group) => (
          <div key={group.title} className="mb-4">
            <p className="mb-2 px-2 text-[9px] font-black uppercase tracking-[0.24em] text-slate-500">
              {group.title}
            </p>
            <div className="grid gap-1.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={[
                      "flex min-h-[44px] items-center gap-3 rounded-2xl border px-3.5 text-[13px] font-bold tracking-[0.04em] transition",
                      active
                        ? "border-sky-300/20 bg-sky-400/12 text-sky-100"
                        : "border-white/5 bg-white/[0.025] text-slate-400 hover:border-sky-300/20 hover:bg-white/[0.045] hover:text-white",
                    ].join(" ")}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon size={17} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-auto shrink-0 rounded-[26px] border border-sky-400/15 bg-sky-400/8 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.30em] text-sky-200">Ordenado</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          Todo vive en Mapa. Sistema en vivo ya no está escondido.
        </p>
      </div>
    </aside>
  );
}
