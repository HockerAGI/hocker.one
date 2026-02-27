"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import NodeBadge from "@/components/NodeBadge";

type NavItem = {
  href: string;
  label: string;
  desc: string;
  icon: (props: { className?: string }) => JSX.Element;
};

function IconGrid({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h7v7H4z" />
      <path d="M13 4h7v7h-7z" />
      <path d="M4 13h7v7H4z" />
      <path d="M13 13h7v7h-7z" />
    </svg>
  );
}

function IconChat({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
    </svg>
  );
}

function IconBolt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M13 2 3 14h8l-1 8 10-12h-8z" />
    </svg>
  );
}

function IconServer({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16v6H4z" />
      <path d="M4 14h16v6H4z" />
      <path d="M7 7h.01" />
      <path d="M7 17h.01" />
    </svg>
  );
}

function IconBrain({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 5a3 3 0 0 1 6 0" />
      <path d="M8 6a4 4 0 0 0-4 4v2a4 4 0 0 0 4 4" />
      <path d="M16 6a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4" />
      <path d="M9 21a3 3 0 0 1-3-3v-1" />
      <path d="M15 21a3 3 0 0 0 3-3v-1" />
      <path d="M12 8v8" />
    </svg>
  );
}

function IconBox({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 8 12 3 3 8l9 5z" />
      <path d="M21 8v8l-9 5-9-5V8" />
      <path d="M12 13v8" />
    </svg>
  );
}

function IconShield({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2 20 6v6c0 5-3.5 9.5-8 10-4.5-.5-8-5-8-10V6z" />
    </svg>
  );
}

const ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Panel", desc: "Resumen operativo", icon: IconGrid },
  { href: "/chat", label: "Chat NOVA", desc: "Instrucciones", icon: IconChat },
  { href: "/commands", label: "Acciones", desc: "Cola y aprobaciones", icon: IconBolt },
  { href: "/nodes", label: "Nodos", desc: "Agentes conectados", icon: IconServer },
  { href: "/agis", label: "Agentes IA", desc: "Mente colmena", icon: IconBrain },
  { href: "/supply", label: "Supply", desc: "Inventario y órdenes", icon: IconBox },
  { href: "/governance", label: "Seguridad", desc: "Kill switch + permisos", icon: IconShield },
];

export default function AppNav() {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);

  const active = useMemo(() => {
    const match = ITEMS.find((i) => pathname === i.href || pathname.startsWith(i.href + "/"));
    return match?.href ?? "";
  }, [pathname]);

  return (
    <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/dashboard" className="group flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
                <span className="text-sm font-extrabold tracking-tight">H</span>
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-extrabold tracking-tight">HOCKER ONE</div>
                <div className="truncate text-[11px] text-slate-500">Control Plane</div>
              </div>
            </Link>

            <div className="hidden md:block">
              <NodeBadge />
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {ITEMS.map((it) => {
              const isActive = active === it.href;
              const Icon = it.icon;
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={
                    "group inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors " +
                    (isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-100")
                  }
                  title={it.desc}
                >
                  <Icon className={"h-4 w-4 " + (isActive ? "text-white" : "text-slate-500 group-hover:text-slate-700")} />
                  <span>{it.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="hidden md:inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              title="Volver"
            >
              Volver
            </button>

            <form action="/signout" method="post" className="hidden md:block">
              <button
                type="submit"
                className="inline-flex items-center rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                title="Cerrar sesión"
              >
                Salir
              </button>
            </form>

            {/* Mobile menu */}
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2 hover:bg-slate-50 lg:hidden"
              aria-label="Abrir menú"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16" />
                <path d="M4 12h16" />
                <path d="M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {open && (
          <div className="mt-3 grid gap-2 rounded-2xl border border-slate-200 bg-white p-3 lg:hidden">
            <div className="md:hidden">
              <NodeBadge />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {ITEMS.map((it) => {
                const isActive = active === it.href;
                const Icon = it.icon;
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    onClick={() => setOpen(false)}
                    className={
                      "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold " +
                      (isActive ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700")
                    }
                  >
                    <Icon className={"h-4 w-4 " + (isActive ? "text-white" : "text-slate-500")} />
                    <span>{it.label}</span>
                  </Link>
                );
              })}
            </div>
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => window.history.back()}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Volver
              </button>
              <form action="/signout" method="post" className="w-full">
                <button
                  type="submit"
                  className="w-full rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Salir
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
