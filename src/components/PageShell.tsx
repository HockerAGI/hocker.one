import React from "react";
import AppNav from "@/components/AppNav";

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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <AppNav />

      <main className="mx-auto max-w-7xl px-4 py-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <a href="/dashboard" className="hover:text-slate-700">Panel</a>
              <span>/</span>
              <span className="truncate text-slate-700">{title}</span>
            </div>
            <h1 className="mt-2 truncate text-2xl font-extrabold tracking-tight">{title}</h1>
            {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
          </div>

          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </header>

        <div className="mt-6">{children}</div>
      </main>
    </div>
  );
}
