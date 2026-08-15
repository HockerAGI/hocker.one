"use client";

import Image from "next/image";
import Link from "next/link";
import { Bell, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  getActiveHockerSection,
  HOCKER_NAVIGATION,
} from "@/lib/hocker-navigation";

export default function Sidebar() {
  const pathname = usePathname() || "/app/nova";
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
        // Navigation remains available if the counter is temporarily offline.
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
      className="fixed left-3 top-3 z-[95] hidden h-[calc(100dvh-1.5rem)] w-[240px] flex-col overflow-hidden rounded-[22px] border border-white/[0.07] bg-[#050b16]/94 text-white shadow-[0_28px_72px_rgba(0,0,0,0.42)] backdrop-blur-2xl lg:flex"
      aria-label="Navegación principal"
    >
      <Link
        href="/app/nova"
        className="mx-3 mt-3 flex min-h-[92px] shrink-0 items-center justify-center rounded-[18px] border border-white/[0.055] bg-white/[0.018] px-3 transition-colors hover:bg-white/[0.035]"
        aria-label="Abrir NOVA"
      >
        <Image
          src="/brand/hocker-one-logo.png"
          alt="Hocker ONE"
          className="max-h-14 w-[192px] object-contain drop-shadow-[0_0_24px_rgba(85,220,255,0.15)]"
          width={192}
          height={59}
          priority
        />
      </Link>

      <nav className="mt-5 flex-1 px-3" aria-label="Espacios de trabajo">
        <p className="mb-2 px-2 text-[9px] font-black uppercase tracking-[0.24em] text-slate-600">
          Espacios
        </p>
        <div className="grid gap-1.5">
          {HOCKER_NAVIGATION.map((section) => {
            const Icon = section.icon;
            const active = section.id === activeSection.id;

            return (
              <Link
                key={section.id}
                href={section.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "group flex min-h-12 items-center gap-3 rounded-[15px] border px-3.5 transition-colors",
                  active
                    ? "border-sky-300/18 bg-sky-300/[0.085] text-white"
                    : "border-transparent text-slate-500 hover:border-white/[0.05] hover:bg-white/[0.03] hover:text-slate-200",
                ].join(" ")}
              >
                <span className={[
                  "grid h-8 w-8 place-items-center rounded-xl",
                  active ? "bg-sky-300/12 text-sky-200" : "bg-white/[0.025] text-slate-600 group-hover:text-slate-400",
                ].join(" ")}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-[13px] font-bold">{section.label}</span>
              </Link>
            );
          })}
        </div>

        {pendingCount > 0 ? (
          <Link
            href="/owner/actions"
            className="mt-5 flex min-h-12 items-center gap-3 rounded-[15px] border border-amber-300/15 bg-amber-300/[0.07] px-3.5 text-amber-100 transition-colors hover:bg-amber-300/10"
          >
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-300/10">
              <Bell className="h-4 w-4 text-amber-300" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[12px] font-bold">Aprobaciones</span>
              <span className="block text-[10px] text-amber-200/55">{pendingCount} esperando</span>
            </span>
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-amber-300 px-1.5 text-[9px] font-black text-[#241600]">
              {pendingCount}
            </span>
          </Link>
        ) : null}
      </nav>

      <button
        type="button"
        onClick={triggerPalette}
        className="mx-3 mb-3 flex min-h-12 shrink-0 items-center gap-3 rounded-[15px] border border-white/[0.06] bg-white/[0.025] px-3.5 text-left transition-colors hover:bg-white/[0.045]"
        aria-label="Buscar o abrir más opciones"
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-sky-300/[0.08] text-sky-300">
          <Search className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-bold text-slate-200">Buscar</span>
          <span className="block truncate text-[9px] text-slate-600">Apps, AGIs, recursos y vistas</span>
        </span>
        <kbd className="rounded-lg border border-white/[0.07] bg-white/[0.025] px-1.5 py-1 text-[8px] font-bold text-slate-600">⌘K</kbd>
      </button>
    </aside>
  );
}
