"use client";

import Image from "next/image";
import Link from "next/link";
import { Bell, ChevronRight, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getActiveHockerSection,
  HOCKER_NAVIGATION,
  isHockerRouteActive,
} from "@/lib/hocker-navigation";

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
        // Navigation must remain available when the counter is offline.
      }
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
    <aside
      className="hko-sidebar fixed left-3 top-3 z-[95] hidden h-[calc(100dvh-1.5rem)] w-[264px] flex-col overflow-hidden rounded-[28px] border border-white/[0.07] bg-[#050d1a]/90 text-white shadow-[0_32px_80px_rgba(0,0,0,0.5)] backdrop-blur-3xl lg:flex"
      aria-label="Navegación principal"
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
          priority
        />
      </Link>

      {pendingCount > 0 ? (
        <Link
          href="/owner/actions"
          className="mx-3 mt-2.5 flex min-h-11 items-center gap-2.5 rounded-2xl border border-amber-400/20 bg-amber-400/10 px-3.5 py-2.5 transition-colors hover:bg-amber-400/15"
        >
          <Bell className="h-3.5 w-3.5 shrink-0 text-amber-300" />
          <span className="flex-1 text-[10px] font-black uppercase tracking-[0.16em] text-amber-200">
            {pendingCount} por aprobar
          </span>
          <ChevronRight className="h-3 w-3 text-amber-400/60" />
        </Link>
      ) : null}

      <nav className="mt-3 flex-1 overflow-y-auto px-3 pb-2 hko-sidebar-scroll">
        <div className="mb-4">
          <p className="mb-1.5 px-2 text-[8.5px] font-black uppercase tracking-[0.28em] text-slate-600">
            Dominios
          </p>
          <div className="grid gap-1">
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
                    "group flex min-h-11 items-center gap-3 rounded-[15px] border px-3.5 transition-all duration-150",
                    active
                      ? "border-sky-400/20 bg-gradient-to-r from-sky-400/12 to-sky-500/5 text-sky-100 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.08)]"
                      : "border-transparent text-slate-500 hover:border-white/[0.06] hover:bg-white/[0.035] hover:text-slate-200",
                  ].join(" ")}
                >
                  <Icon
                    className={active ? "h-4 w-4 text-sky-300" : "h-4 w-4 text-slate-600 group-hover:text-slate-400"}
                  />
                  <span className={active ? "flex-1 text-[12px] font-bold" : "flex-1 text-[12px] font-semibold"}>
                    {section.label}
                  </span>
                  {showPending ? (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1.5 text-[9px] font-black text-black">
                      {pendingCount}
                    </span>
                  ) : null}
                  {active ? <ChevronRight className="h-3 w-3 text-sky-400/55" /> : null}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="rounded-[20px] border border-white/[0.06] bg-white/[0.025] p-2">
          <p className="mb-1.5 px-2 pt-1 text-[8.5px] font-black uppercase tracking-[0.25em] text-slate-600">
            Vistas · {activeSection.label}
          </p>
          <div className="grid gap-0.5">
            {activeSection.items.map((item) => {
              const Icon = item.icon;
              const active = isHockerRouteActive(pathname, item.href);
              const showPending = item.id === "owner-actions" && pendingCount > 0;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "group flex min-h-10 items-center gap-2.5 rounded-[13px] border px-3 transition-all",
                    active
                      ? "border-sky-400/15 bg-sky-400/9 text-sky-100"
                      : "border-transparent text-slate-500 hover:bg-white/[0.04] hover:text-slate-200",
                  ].join(" ")}
                >
                  <Icon className={active ? "h-3.5 w-3.5 text-sky-300" : "h-3.5 w-3.5 text-slate-600"} />
                  <span className="min-w-0 flex-1 truncate text-[11px] font-semibold">
                    {item.label}
                  </span>
                  {showPending ? (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-400 px-1 text-[8px] font-black text-black">
                      {pendingCount}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <button
        type="button"
        onClick={triggerPalette}
        className="mx-3 mb-3 flex min-h-12 shrink-0 items-center gap-3 rounded-[18px] border border-sky-400/12 bg-gradient-to-r from-sky-400/8 to-transparent px-4 text-left transition-colors hover:bg-sky-400/10"
        aria-label="Buscar en Hocker ONE"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-400/12">
          <Search className="h-4 w-4 text-sky-300" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-sky-200">Buscar</span>
          <span className="block truncate text-[10px] font-medium text-slate-500">Apps, AGIs, herramientas y vistas</span>
        </span>
        <kbd className="rounded-lg border border-white/10 bg-white/[0.04] px-1.5 py-1 text-[8px] font-black text-slate-500">⌘K</kbd>
      </button>
    </aside>
  );
}
