import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type PageLayoutProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  subtitle?: string;
  actions?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
  bodyClassName?: string;
  compact?: boolean;
  fullBleed?: boolean;
};

export function PageLayout({
  eyebrow,
  title,
  description,
  subtitle,
  actions,
  children,
  footer,
  className,
  bodyClassName,
  compact = false,
  fullBleed = false,
}: PageLayoutProps) {
  const body = description ?? subtitle;

  return (
    <section className={cn("relative", className)}>
      <div className={cn(fullBleed ? "w-full" : "mx-auto w-full max-w-[1600px]", "py-1 sm:py-2")}>
        <header className="relative overflow-hidden rounded-[30px] border border-white/[0.07] bg-gradient-to-br from-white/[0.055] via-[#07101f]/80 to-sky-500/[0.035] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.24)] backdrop-blur-2xl sm:p-7">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.15),transparent_32%),linear-gradient(120deg,rgba(255,255,255,0.025),transparent_50%)]"
            aria-hidden="true"
          />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0 max-w-4xl">
              {eyebrow ? (
                <p className="text-[0.68rem] font-black uppercase tracking-[0.32em] text-sky-300/80">
                  {eyebrow}
                </p>
              ) : null}
              <h1
                className={cn(
                  "mt-3 font-black leading-[0.98] tracking-[-0.045em] text-white",
                  compact ? "text-3xl sm:text-4xl" : "text-4xl sm:text-5xl lg:text-6xl",
                )}
              >
                {title}
              </h1>
              {body ? (
                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                  {body}
                </p>
              ) : null}
            </div>

            {actions ? (
              <div className="flex shrink-0 flex-wrap items-center gap-2 md:justify-end">
                {actions}
              </div>
            ) : null}
          </div>
        </header>

        {children ? (
          <div className={cn("mt-5 min-w-0", bodyClassName)}>
            {children}
          </div>
        ) : null}

        {footer ? (
          <div className="mt-5 rounded-[22px] border border-white/[0.06] bg-white/[0.025] px-4 py-3 backdrop-blur-xl">
            {footer}
          </div>
        ) : null}
      </div>
    </section>
  );
}
