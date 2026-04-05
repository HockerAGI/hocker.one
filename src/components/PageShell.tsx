import type { ReactNode } from "react";
import BrandMark from "@/components/BrandMark";

type PageShellProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export default function PageShell({
  title,
  subtitle,
  actions,
  children,
  className = "",
}: PageShellProps) {
  return (
    <main className={`mx-auto w-full max-w-7xl px-4 pb-32 pt-4 sm:px-6 lg:px-8 lg:pb-36 ${className}`}>
      <section className="relative overflow-hidden rounded-[34px] border border-white/5 bg-white/[0.03] shadow-[0_30px_120px_rgba(2,6,23,0.42)] backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(14,165,233,0.07),transparent_30%,rgba(56,189,248,0.04),transparent_70%)]" />
        <div className="pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/20 to-transparent" />

        <div className="relative flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 flex-col gap-4">
              <BrandMark />

              <div className="max-w-3xl space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.35em] text-sky-400">
                  Hocker ONE
                </p>
                <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                  {title}
                </h1>
                {subtitle ? (
                  <p className="max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
                    {subtitle}
                  </p>
                ) : null}
              </div>
            </div>

            {actions ? (
              <div className="flex flex-wrap gap-2 lg:justify-end">{actions}</div>
            ) : null}
          </div>

          <div className="rounded-[28px] border border-white/5 bg-slate-950/35 p-4 shadow-[0_10px_60px_rgba(2,6,23,0.2)] sm:p-5 lg:p-6">
            {children}
          </div>
        </div>
      </section>
    </main>
  );
}