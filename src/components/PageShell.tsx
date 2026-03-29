import React from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import BrandMark from "@/components/BrandMark";
import InteractiveBackground from "@/components/InteractiveBackground";
import ErrorBoundary from "@/components/ErrorBoundary";

export default function PageShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    /* FONDO: Cambiamos a un Slate-950 con degradados azules profundos para dar atmósfera */
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      
      {/* CAPAS DE PROFUNDIDAD: Glows tácticos en las esquinas */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-[10%] -top-[10%] h-[50%] w-[50%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute -right-[10%] -bottom-[10%] h-[50%] w-[50%] rounded-full bg-indigo-600/10 blur-[120px]" />
      </div>

      <InteractiveBackground />
      <AppNav />

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out fill-mode-both">
        
        {/* CONTENEDOR MAESTRO: Efecto Cristal Esmerilado Oscuro (Dark Glass) */}
        <div className="rounded-[32px] border border-white/10 bg-slate-900/60 p-6 shadow-2xl shadow-black/50 backdrop-blur-2xl transition-all">
          
          {/* HEADER DEL PANEL */}
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between border-b border-white/5 pb-6">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <BrandMark compact />
                <div className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.24em] text-blue-400 shadow-inner backdrop-blur-md">
                  Control Plane
                </div>
              </div>

              {/* BREADCRUMB TÁCTICO */}
              <div className="mt-6 flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <Link href="/dashboard" className="transition-colors hover:text-blue-400">
                  Matriz
                </Link>
                <svg className="h-2.5 w-2.5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                <span className="truncate text-blue-500/80">{title}</span>
              </div>

              <h1 className="mt-2 truncate text-3xl font-black tracking-tighter text-white lg:text-4xl">
                {title}
              </h1>

              {subtitle ? (
                <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-400 font-medium">
                  {subtitle}
                </p>
              ) : null}
            </div>

            {actions ? (
              <div className="flex shrink-0 items-center gap-3 mt-4 md:mt-0">
                {actions}
              </div>
            ) : null}
          </div>

          {/* ÁREA OPERATIVA */}
          <div className="mt-8">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </div>
        </div>

        {/* FOOTER DE SEGURIDAD (Opcional) */}
        <div className="mt-6 flex justify-center opacity-30">
          <div className="h-1 w-24 rounded-full bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
        </div>
      </main>
    </div>
  );
}
