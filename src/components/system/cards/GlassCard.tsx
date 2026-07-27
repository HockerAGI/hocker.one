import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Surface } from "../surfaces";

type GlassCardProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
  actions?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
  interactive?: boolean;
};

export function GlassCard({
  eyebrow,
  title,
  description,
  actions,
  footer,
  children,
  className,
  contentClassName,
  interactive = false,
}: GlassCardProps) {
  const hasHeader = Boolean(eyebrow || title || description || actions);
  const hasFooter = Boolean(footer);

  return (
    <Surface variant="glass" interactive={interactive} className={cn("p-0", className)}>
      <div className={cn("p-5 md:p-6", contentClassName)}>
        {hasHeader ? (
          <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              {eyebrow ? (
                <p className="text-[0.7rem] font-black uppercase tracking-[0.35em] text-cyan-200/75">
                  {eyebrow}
                </p>
              ) : null}
              {title ? (
                <h3 className="mt-2 text-lg font-semibold tracking-tight text-white md:text-xl">
                  {title}
                </h3>
              ) : null}
              {description ? (
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--hocker-text-soft)]">
                  {description}
                </p>
              ) : null}
            </div>
            {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
          </header>
        ) : null}

        {children ? <div className={cn(hasHeader && "mt-5", "min-w-0")}>{children}</div> : null}

        {hasFooter ? <div className="mt-5 border-t border-white/8 pt-4">{footer}</div> : null}
      </div>
    </Surface>
  );
}
