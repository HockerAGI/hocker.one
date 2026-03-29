import React from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import BrandMark from "@/components/BrandMark";
import InteractiveBackground from "@/components/InteractiveBackground";

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
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,.05),transparent_30%),radial-gradient(circle_at_top_right,rgba(37,99,235,.05),transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eef5ff_100%)] text-slate-900">
      <InteractiveBackground />
      <AppNav />

      {/* Se agregó animación de entrada cinemática al contenedor principal */}
      <main className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both">
        <div className="rounded-[28px] border border-slate-200/80 bg-white/80 p-5 shadow-xl shadow-slate-900/5 backdrop-blur-xl transition-all">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between border-b border-slate-100/50 pb-5">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <BrandMark compact />
                <div className="rounded-full border border-blue-200/60 bg-blue-50/50 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.24em] text-blue-600 shadow-sm backdrop-blur-md">
                  Control Plane
                </div>
              </div>

              <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <Link href="/dashboard" className="transition-colors hover:text-blue-600">
                  Panel
                </Link>
                <svg className="h-3 w-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                <span className="truncate text-slate-900">{title}</span>
              </div>

              <h1 className="mt-2 truncate text-3xl font-black tracking-tight text-slate-950 lg:text-4xl">
                {title}
              </h1>

              {subtitle ? (
                <p className="mt-2.5 max-w-3xl text-[15px] leading-relaxed text-slate-500">
                  {subtitle}
                </p>
              ) : null}
            </div>

            {actions ? (
              <div className="flex shrink-0 items-center gap-3 mt-2 md:mt-0">
                {actions}
              </div>
            ) : null}
          </div>

          <div className="mt-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
