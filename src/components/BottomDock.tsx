"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Bell, Bot, Home, Map, Search } from "lucide-react";
import { useState, useEffect } from "react";

const ITEMS = [
  { href: "/owner", label: "Inicio", icon: Home },
  { href: "/map", label: "Mapa", icon: Map },
  { href: "/live", label: "Vivo", icon: Activity },
  { href: "/chat", label: "NOVA", icon: Bot },
];

export default function BottomDock() {
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
      } catch { /* silencioso */ }
    };
    void fetchPending();
    const id = setInterval(() => { void fetchPending(); }, 30_000);
    return () => clearInterval(id);
  }, []);

  function triggerPalette() {
    window.dispatchEvent(
      new KeyboardEvent("keydown", {
        key: "k",
        metaKey: true,
        ctrlKey: !navigator.platform.includes("Mac"),
        bubbles: true,
      }),
    );
  }

  return (
    <div className="hko-bottom-dock-wrap">
      <nav data-hocker-bottom-dock className="hko-bottom-dock" aria-label="Navegación principal">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === "/owner"
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

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

        {/* Approvals bell */}
        <Link
          href="/chat"
          aria-label={`${pendingCount} aprobaciones pendientes`}
          className="relative"
        >
          <Bell className="h-5 w-5" />
          {pendingCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-400 px-1 text-[7px] font-black text-black">
              {pendingCount}
            </span>
          )}
          <span>Alertas</span>
        </Link>

        <button
          type="button"
          onClick={triggerPalette}
          aria-label="Buscar (⌘K)"
          className="hko-bottom-dock-search-btn"
        >
          <Search className="h-5 w-5" />
          <span>Buscar</span>
        </button>
      </nav>
    </div>
  );
}
