"use client";

import Link from "next/link";
import {
  Bot,
  Command,
  Gauge,
  Grid2X2,
  Network,
  ShieldCheck,
  Store,
} from "lucide-react";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "Inicio", icon: Grid2X2 },
  { href: "/dashboard", label: "Panel", icon: Gauge },
  { href: "/chat", label: "NOVA", icon: Bot },
  { href: "/commands", label: "Tareas", icon: Command },
  { href: "/nodes", label: "Nodos", icon: Network },
  { href: "/governance", label: "Guardia", icon: ShieldCheck },
  { href: "/supply", label: "Supply", icon: Store },
];

function active(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function Sidebar() {
  const pathname = usePathname() || "/";

  return (
    <aside className="hkr3-sidebar" aria-label="Menú lateral">
      <Link href="/" className="hkr3-side-logo" aria-label="Inicio">
        <img src="/brand/hocker-one-logo.png" alt="Hocker ONE" />
      </Link>

      <nav>
        {nav.map((item) => {
          const Icon = item.icon;
          const isActive = active(pathname, item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={isActive ? "is-active" : ""}
              title={item.label}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
