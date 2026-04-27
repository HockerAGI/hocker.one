"use client";

import Link from "next/link";
import { Bot, Command, Grid2X2, Network, ShieldCheck, Store } from "lucide-react";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "Inicio", icon: Grid2X2 },
  { href: "/chat", label: "NOVA", icon: Bot },
  { href: "/commands", label: "Tareas", icon: Command },
  { href: "/nodes", label: "Equipo", icon: Network },
  { href: "/supply", label: "Tienda", icon: Store },
  { href: "/governance", label: "Guardia", icon: ShieldCheck }
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      <aside className="hkr-v2-sidebar" aria-label="Menú lateral">
        <Link href="/" className="hkr-v2-sidebar-logo">
          <img src="/brand/hocker-one-logo.png" alt="Hocker ONE" />
        </Link>

        <nav>
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                href={item.href}
                key={item.href}
                className={active ? "is-active" : ""}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <nav className="hkr-v2-bottomnav" aria-label="Menú móvil">
        {nav.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              href={item.href}
              key={item.href}
              className={active ? "is-active" : ""}
            >
              <Icon size={22} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
