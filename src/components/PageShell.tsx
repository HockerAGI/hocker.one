import type { ReactNode } from "react";
import BrandMark from "@/components/BrandMark";

type PageShellProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export default function PageShell({
  title,
  subtitle,
  actions,
  children,
}: PageShellProps) {
  return (
    <main className="relative mx-auto w-full max-w-7xl px-4 pb-28 pt-4 sm:px-6 lg:px-8 lg:pb-32">
      <section className="relative overflow-hidden rounded-[32px] border border-white/5 bg-white/[0.03] shadow-[0_30px_120px_rgba(2,6,23,0.45)] backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(14,165,233,0.06),transparent_30%,rgba(168,85,247,0.06),transparent_70%)]" />
        <div className="pointer-events-none absolute -right-20 top-10 h-56 w-56 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 bottom-12 h-56 w-56 rounded-full bg-fuchsia-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 flex-col gap-4">
              <BrandMark />

              <div className="max-w-3xl space-y-2">
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

          <div className="rounded-[28px] border border-white/5 bg-slate-950/30 p-4 shadow-[0_10px_60px_rgba(2,6,23,0.2)] sm:p-5 lg:p-6">
            {children}
          </div>
        </div>
      </section>
    </main>
  );
}