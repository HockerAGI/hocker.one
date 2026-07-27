import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
};

export function WorkspaceHeader({
  title,
  description,
 eyebrow,
  actions,
  className,
}: Props) {
  return (
    <header
      className={cn(
        "flex flex-col gap-5 border-b border-white/10 pb-6 md:flex-row md:items-end md:justify-between",
        className,
      )}
    >
      <div className="space-y-2">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-300">
            {eyebrow}
          </p>
        )}

        <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
          {title}
        </h1>

        {description && (
          <p className="max-w-2xl text-sm leading-7 text-slate-300">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-3">
          {actions}
        </div>
      )}
    </header>
  );
}
