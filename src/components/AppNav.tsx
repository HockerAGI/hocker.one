"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation"; // Inyectamos el enrutador inteligente
import { useMemo, useState, type ReactElement } from "react";
import NodeBadge from "@/components/NodeBadge";
import WorkspaceBar from "@/components/WorkspaceBar";
import BrandMark from "@/components/BrandMark";

type NavItem = {
  href: string;
  label: string;
  desc: string;
  icon: (props: { className?: string }) => ReactElement;
};

// ==========================================
// ICONOGRAFÍA PREMIUM (Bordes redondeados y suaves)
// ==========================================
const svgProps = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function IconGrid({ className }: { className?: string }) {
  return (
    <svg {...svgProps} className={className}>
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  );
}
function IconChat({ className }: { className?: string }) {
  return (
    <svg {...svgProps} className={className}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
function IconBolt({ className }: { className?: string }) {
  return (
    <svg {...svgProps} className={className}>
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </svg>
  );
}
function IconServer({ className }: { className?: string }) {
  return (
    <svg {...svgProps} className={className}>
      <rect width="20" height="8" x="2" y="2" rx="2" ry="2" />
      <rect width="20" height="8" x="2" y="14" rx="2" ry="2" />
      <line x1="6" x2="6.01" y1="6" y2="6" />
      <line x1="6" x2="6.01" y1="18" y2="18" />
    </svg>
  );
}
function IconBrain({ className }: { className?: string }) {
  return (
    <svg {...svgProps} className={className}>
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
      <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
      <path d="M6.002 5.125A3 3 0 0 0 6.401 6.5" />
      <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
      <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
      <path d="M6 18a4 4 0 0 1-1.967-.516" />
      <path d="M19.967 17.484A4 4 0 0 1 18 18" />
    </svg>
  );
}
function IconBox({ className }: { className?: string }) {
  return (
    <svg {...svgProps} className={className}>
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}
function IconShield({ className }: { className?: string }) {
  return (
    <svg {...svgProps} className={className}>
      <path d="M20 13c0 5-3.5 9.5-8 10-4.5-.5-8-5-8-10V5l8-3 8 3v8Z" />
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
  const router = useRouter(); // Cargamos el enrutador de Vercel
  const [open, setOpen] = useState(false);

  const active = useMemo(() => {
    const match = ITEMS.find((i) => pathname === i.href || pathname.startsWith(i.href + "/"));
    return match?.href ?? "";
  }, [pathname]);

  return (
    <div className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl transition-all">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Link href="/dashboard" className="group flex items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-slate-900 rounded-2xl">
                <BrandMark compact showWordmark />
              </Link>

              <div className="hidden md:block">
                <NodeBadge />
              </div>
            </div>

            <nav className="hidden lg:flex items-center gap-1">
              {ITEMS.map((it) => {
                const isActive = active === it.href;
                const Icon = it.icon;
                return (
                  <Link
                    key={it.href}
                    href={it.href}
                    className={
                      "group inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold transition-all outline-none focus-visible:ring-2 focus-visible:ring-slate-900 " +
                      (isActive
                        ? "bg-slate-950 text-white shadow-lg shadow-slate-900/20"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100")
                    }
                    title={it.desc}
                  >
                    <Icon className={"h-4 w-4 transition-colors " + (isActive ? "text-white" : "text-slate-400 group-hover:text-slate-700")} />
                    <span>{it.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.back()} // Navegación fluida SPA
                className="hidden md:inline-flex items-center rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
                title="Volver a la pantalla anterior"
              >
                Volver
              </button>

              <form action="/signout" method="post" className="hidden md:block">
                <button
                  type="submit"
                  className="inline-flex items-center rounded-2xl bg-slate-950 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 hover:shadow-md transition-all outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
                  title="Cerrar sesión de forma segura"
                >
                  Salir
                </button>
              </form>

              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open} // Accesibilidad para lectores de pantalla
                aria-label={open ? "Cerrar menú" : "Abrir menú"}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-2 hover:bg-slate-50 transition-colors lg:hidden outline-none focus-visible:ring-2 focus-visible:ring-slate-900"
              >
                <svg {...svgProps} className="h-5 w-5 text-slate-700">
                  {open ? (
                    <>
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </>
                  ) : (
                    <>
                      <path d="M4 6h16" />
                      <path d="M4 12h16" />
                      <path d="M4 18h16" />
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>

          <WorkspaceBar />

          {open && (
            <div className="grid gap-2 rounded-3xl border border-slate-200 bg-white/95 p-3 shadow-xl shadow-slate-900/10 backdrop-blur-md lg:hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="md:hidden mb-1">
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
                        "flex items-center gap-2 rounded-2xl border px-3 py-2.5 text-sm font-semibold transition-all active:scale-95 " +
                        (isActive
                          ? "border-slate-950 bg-slate-950 text-white shadow-md shadow-slate-900/20"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300")
                      }
                    >
                      <Icon className={"h-4 w-4 " + (isActive ? "text-white" : "text-slate-400")} />
                      <span>{it.label}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    router.back();
                  }}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-95 transition-all"
                >
                  Volver
                </button>
                <form action="/signout" method="post" className="w-full">
                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-slate-950 px-3 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 active:scale-95 transition-all"
                  >
                    Salir
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
