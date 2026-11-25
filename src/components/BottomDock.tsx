"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { HOCKER_MOBILE_NAVIGATION, getActiveHockerSection } from "@/lib/hocker-navigation";

export default function BottomDock() {
  const pathname = usePathname() || "/owner";
  const activeSection = getActiveHockerSection(pathname);
  const activeMobileId = activeSection.id === "operacion" ? "mas" : activeSection.id;
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const res = await fetch("/api/agi/runtime/actions?status=needs_approval", { cache: "no-store" });
        const data = await res.json() as { ok?: boolean; actions?: unknown[] };
        if (!res.ok || data.ok !== true || !Array.isArray(data.actions)) throw new Error("Cola no disponible");
        setPendingCount(data.actions.length);
      } catch {
        setPendingCount(0);
        // Navigation remains available if the counter is unavailable.
      }
    };
    void fetchPending();
    const id = setInterval(() => { void fetchPending(); }, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="hko-bottom-dock-wrap lg:hidden">
      <nav className="hko-bottom-dock" aria-label="Navegación principal móvil">
        {HOCKER_MOBILE_NAVIGATION.map((item) => {
          const Icon = item.icon;
          const active = item.id === activeMobileId;
          const showPending = item.id === "trabajo" && pendingCount > 0;
          return (
            <Link key={item.id} href={item.href} aria-label={item.label} aria-current={active ? "page" : undefined} className={[active ? "is-active" : "", item.id === "nova" ? "is-nova" : "", "relative"].join(" ")}>
              <Icon className="h-5 w-5" />
              {showPending ? <span className="absolute right-[18%] top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-400 px-1 text-[7px] font-black text-black">{pendingCount === 30 ? "30+" : pendingCount}</span> : null}
              <span>{item.shortLabel ?? item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
