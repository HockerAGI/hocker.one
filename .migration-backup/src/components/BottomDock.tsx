"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Brain, CheckSquare, Home, Map } from "lucide-react";

const ITEMS = [
  { href: "/owner", label: "Inicio", icon: Home },
  { href: "/map", label: "Mapa", icon: Map },
  { href: "/live", label: "Vivo", icon: Activity },
  { href: "/chat", label: "NOVA", icon: Brain },
  { href: "/commands", label: "Tareas", icon: CheckSquare },
];

export default function BottomDock() {
  const pathname = usePathname() || "/";

  return (
    <div className="hko-bottom-dock-wrap">
      <nav data-hocker-bottom-dock className="hko-bottom-dock" aria-label="Navegación principal">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={active ? "is-active" : ""}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
