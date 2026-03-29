"use client";

import React from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import BrandMark from "@/components/BrandMark";
import InteractiveBackground from "@/components/InteractiveBackground";
import ErrorBoundary from "@/components/ErrorBoundary";

interface PageShellProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export default function PageShell({
  title,
  subtitle,
  actions,
  children,
}: PageShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100 selection:bg-blue-500/30">
      
      {/* CAPA ATMOSFÉRICA: Profundidad táctica */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -left-[10%] -top-[10%] h-[50%] w-[50%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute -right-[10%] -bottom-[10%] h-[50%] w-[50%] rounded-full bg-indigo-600/10 blur-[120px]" />
      </div>

      {/* COMPONENTES DE FONDO Y NAVEGACIÓN */}
      <InteractiveBackground />
      <AppNav />

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out fill-mode-both">
        
        {/* PANEL PRINCIPAL: Efecto Dark Glass con borde de luz */}
        <div className="rounded-[32px] border border-white/10 bg-slate-900/60 p-6 shadow-2xl shadow-black/50 backdrop-blur-2xl transition-all">
          
          {/* CABECERA DE AUTORIDAD */}
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between border-b border-white/5 pb-6">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-4">
                {/* Logo con resplandor azul Hocker */}
                <div className="relative group transition-all duration-500 hover:drop-shadow-[0_0_15px_rgba(14,165,233,0.5)]">
                  <BrandMark compact />
                </div>
                
                {/* Indicador de Estado del Sistema */}
                <div className="rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-blue-300 shadow-[inset_0_0_10px_rgba(56,189,248,0.1)] backdrop-blur-md">
                  Omni-Sync 2025
                </div>
              </div>

              {/* BREADCRUMB: Navegación de ruta */}
              <div className="mt-6 flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <Link href="/dashboard" className="transition-colors hover:text-blue-400">
                  Matriz
                </Link>
                <svg className="h-2.5 w-2.5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                <span className="truncate text-blue-500/80">{title}</span>
              </div>

              {/* TÍTULOS ESTRATÉGICOS */}
              <h1 className="mt-3 truncate text-4xl font-black tracking-tighter text-white lg:text-5xl drop-shadow-sm">
                {title}
              </h1>

              {subtitle ? (
                <p className="mt-3 max-w-3xl text-[16px] leading-relaxed text-slate-300 font-medium antialiased">
                  {subtitle}
                </p>
              ) : null}
            </div>

            {/* ACCIONES RÁPIDAS */}
            {actions ? (
              <div className="flex shrink-0 items-center gap-3 mt-4 md:mt-0">
                {actions}
              </div>
            ) : null}
          </div>

          {/* CONTENEDOR OPERATIVO: Blindado por el Escudo de Errores */}
          <div className="mt-8">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </div>
        </div>

        {/* LÍNEA DE SEGUIMIENTO (Estética) */}
        <div className="mt-8 flex justify-center opacity-20">
          <div className="h-1 w-32 rounded-full bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
        </div>
      </main>
    </div>
  );
}
