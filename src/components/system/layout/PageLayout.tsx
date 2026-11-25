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
        <header className="relative overflow-hidden rounded-2xl border border-slate-700/65 bg-[#101a29] p-5 sm:p-7">
          <div
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(98,215,255,0.045),transparent_50%)]"
            aria-hidden="true"
          />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="min-w-0 max-w-4xl">
              {eyebrow ? (
                <p className="text-sm font-medium tracking-normal text-sky-200">
                  {eyebrow}
                </p>
              ) : null}
              <h1
                className={cn(
                  "mt-2 font-semibold leading-tight tracking-tight text-white",
                  compact ? "text-2xl sm:text-3xl" : "text-3xl sm:text-4xl",
                )}
              >
                {title}
              </h1>
              {body ? (
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300 sm:text-base">
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
