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
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,.08),transparent_28%),radial-gradient(circle_at_top_right,rgba(37,99,235,.08),transparent_26%),linear-gradient(180deg,#f8fafc_0%,#eef5ff_100%)] text-slate-900">
      <InteractiveBackground />
      <AppNav />

      <main className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-xl shadow-slate-900/5 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <BrandMark compact />
                <div className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-sky-700">
                  Control Plane
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                <Link href="/dashboard" className="hover:text-slate-700">
                  Panel
                </Link>
                <span>/</span>
                <span className="truncate text-slate-700">{title}</span>
              </div>

              <h1 className="mt-2 truncate text-3xl font-black tracking-tight text-slate-950">
                {title}
              </h1>

              {subtitle ? (
                <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
                  {subtitle}
                </p>
              ) : null}
            </div>

            {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
          </div>
        </div>

        <div className="mt-6">{children}</div>
      </main>
    </div>
  );
}
