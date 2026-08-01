"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getActiveHockerSection,
  HOCKER_NAVIGATION,
} from "@/lib/hocker-navigation";

export default function BottomDock() {
  const pathname = usePathname() || "/owner";
  const activeSection = getActiveHockerSection(pathname);
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
        // Mobile navigation remains functional if the counter is unavailable.
      }
    };

    void fetchPending();
    const id = setInterval(() => { void fetchPending(); }, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="hko-bottom-dock-wrap lg:hidden">
      <nav className="hko-bottom-dock" aria-label="Navegación principal móvil">
        {HOCKER_NAVIGATION.map((section) => {
          const Icon = section.icon;
          const active = section.id === activeSection.id;
          const showPending = section.id === "control" && pendingCount > 0;

          return (
            <Link
              key={section.id}
              href={section.href}
              aria-current={active ? "page" : undefined}
              className={[
                active ? "is-active" : "",
                section.id === "nova" ? "is-nova" : "",
                "relative",
              ].join(" ")}
            >
              <Icon className="h-5 w-5" />
              {showPending ? (
                <span className="absolute right-[18%] top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-400 px-1 text-[7px] font-black text-black">
                  {pendingCount}
                </span>
              ) : null}
              <span>{section.shortLabel}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
