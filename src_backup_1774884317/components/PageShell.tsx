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

export default function PageShell({ title, subtitle, actions, children }: PageShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -left-[10%] -top-[10%] h-[50%] w-[50%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute -right-[10%] -bottom-[10%] h-[50%] w-[50%] rounded-full bg-indigo-600/10 blur-[120px]" />
      </div>

      <InteractiveBackground />
      <AppNav />

      <main className="hocker-dark-scope relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-white/10 bg-slate-900/60 p-5 shadow-2xl shadow-black/50 backdrop-blur-2xl sm:p-6">
          <div className="flex flex-col gap-5 border-b border-white/5 pb-6 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-4">
                <div className="transition-all duration-500 hover:drop-shadow-[0_0_15px_rgba(14,165,233,0.5)]">
                  <BrandMark compact />
                </div>

                <div className="hocker-chip border-blue-400/30 bg-blue-500/10 text-blue-200">
                  Omni-Sync 2025
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <Link href="/dashboard" className="transition-colors hover:text-sky-400">
                  Matriz
                </Link>
                <svg className="h-2.5 w-2.5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
                <span className="truncate text-sky-300/90">{title}</span>
              </div>

              <h1 className="mt-3 truncate text-3xl font-black tracking-tighter text-white sm:text-4xl lg:text-5xl">
                {title}
              </h1>

              {subtitle ? (
                <p className="mt-3 max-w-3xl text-[15px] leading-relaxed text-slate-300">
                  {subtitle}
                </p>
              ) : null}
            </div>

            {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
          </div>

          <div className="mt-8">
            <ErrorBoundary>{children}</ErrorBoundary>
          </div>
        </div>
      </main>
    </div>
  );
}