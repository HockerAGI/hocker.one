import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Surface } from "../surfaces";

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
      <div className={cn(fullBleed ? "w-full" : "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", "py-4 sm:py-6")}>
        <Surface variant="glass" className="p-0">
          <div className={cn("p-5 md:p-7", compact && "md:p-5")}>
            <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                {eyebrow ? (
                  <p className="text-[0.7rem] font-black uppercase tracking-[0.35em] text-cyan-200/75">
                    {eyebrow}
                  </p>
                ) : null}
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-5xl">
                  {title}
                </h1>
                {body ? (
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--hocker-text-soft)] md:text-base">
                    {body}
                  </p>
                ) : null}
              </div>

              {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
            </header>

            {children ? <div className={cn("mt-6 min-w-0", bodyClassName)}>{children}</div> : null}

            {footer ? <div className="mt-6 border-t border-white/8 pt-4">{footer}</div> : null}
          </div>
        </Surface>
      </div>
    </section>
  );
}
