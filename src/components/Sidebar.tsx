"use client";

import Image from "next/image";
import Link from "next/link";
import { Bell, ChevronDown, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getActiveHockerSection, HOCKER_NAVIGATION, isHockerRouteActive } from "@/lib/hocker-navigation";

export default function Sidebar() {
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
        // Navigation must remain usable if the counter is offline.
      }
    };
    void fetchPending();
    const id = setInterval(() => { void fetchPending(); }, 30_000);
    return () => clearInterval(id);
  }, []);

  function triggerPalette() {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, ctrlKey: !navigator.platform.includes("Mac"), bubbles: true }));
  }

  return (
    <aside className="hko-sidebar fixed left-3 top-3 z-[95] hidden h-[calc(100dvh-1.5rem)] w-[264px] flex-col overflow-hidden rounded-[28px] border border-white/[0.07] bg-[#050d1a]/90 text-white shadow-[0_24px_70px_rgba(0,0,0,0.42)] backdrop-blur-3xl lg:flex" aria-label="Navegación principal">
      <Link href="/owner" className="mx-3 mt-3 flex h-[58px] shrink-0 items-center justify-center rounded-[18px]" aria-label="Inicio">
        <Image src="/brand/hocker-one-logo.png" alt="Hocker ONE" className="max-h-9 w-[144px] object-contain" width={152} height={40} priority />
      </Link>

      {pendingCount > 0 ? (
        <Link href="/owner/actions" className="mx-3 mt-2 flex min-h-11 items-center gap-2.5 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-3.5 py-2.5 text-amber-100">
          <Bell className="h-4 w-4" /><span className="flex-1 text-xs font-semibold">{pendingCount} por aprobar</span>
        </Link>
      ) : null}

      <nav className="mt-3 flex-1 overflow-y-auto px-3 pb-3 hko-sidebar-scroll">
        <div className="grid gap-1">
          {HOCKER_NAVIGATION.map((section) => {
            const Icon = section.icon;
            const active = section.id === activeSection.id;
            return (
              <Link key={section.id} href={section.href} aria-current={active ? "page" : undefined} className={["flex min-h-11 items-center gap-3 rounded-[15px] px-3.5 text-sm font-semibold transition-colors", active ? "bg-sky-400/12 text-sky-100" : "text-slate-400 hover:bg-white/[0.04] hover:text-white"].join(" ")}>
                <Icon className="h-4 w-4" /><span>{section.label}</span>
              </Link>
            );
          })}
        </div>

        {activeSection.items.length > 1 ? (
          <details className="mt-4 rounded-[18px] border border-white/[0.06] bg-white/[0.02] p-2">
            <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-xl px-2.5 text-xs font-semibold text-slate-400">
              <ChevronDown className="h-4 w-4" /> En {activeSection.label}
            </summary>
            <div className="mt-1 grid gap-0.5">
              {activeSection.items.map((item) => {
                const Icon = item.icon;
                const active = isHockerRouteActive(pathname, item.href);
                return (
                  <Link key={item.id} href={item.href} aria-current={active ? "page" : undefined} className={["flex min-h-10 items-center gap-2.5 rounded-xl px-3 text-xs font-medium", active ? "bg-sky-400/10 text-sky-100" : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-200"].join(" ")}>
                    <Icon className="h-3.5 w-3.5" />{item.label}
                  </Link>
                );
              })}
            </div>
          </details>
        ) : null}
      </nav>

      <button type="button" onClick={triggerPalette} className="mx-3 mb-3 flex min-h-12 items-center gap-3 rounded-[16px] border border-white/[0.07] bg-white/[0.03] px-4 text-left text-slate-300 hover:bg-white/[0.06]" aria-label="Buscar">
        <Search className="h-4 w-4 text-sky-300" /><span className="flex-1 text-xs font-semibold">Buscar</span><kbd className="text-[9px] text-slate-600">⌘K</kbd>
      </button>
    </aside>
  );
}
