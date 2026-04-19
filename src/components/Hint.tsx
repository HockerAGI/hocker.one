"use client";

import type { ReactNode } from "react";
import { Sparkles, Info, ArrowRight } from "lucide-react";

type HintTone = "sky" | "emerald" | "amber" | "rose" | "violet";

type HintProps = {
  title?: string;
  children: ReactNode;
  tone?: HintTone;
  icon?: ReactNode;
  className?: string;
  actionLabel?: string;
  actionHref?: string;
};

const toneStyles: Record<HintTone, string> = {
  sky: "border-sky-400/15 bg-sky-400/[0.06] text-sky-100",
  emerald: "border-emerald-400/15 bg-emerald-400/[0.06] text-emerald-100",
  amber: "border-amber-400/15 bg-amber-400/[0.06] text-amber-100",
  rose: "border-rose-400/15 bg-rose-400/[0.06] text-rose-100",
  violet: "border-violet-400/15 bg-violet-400/[0.06] text-violet-100",
};

export default function Hint({
  title = "Nota",
  children,
  tone = "sky",
  icon,
  className = "",
  actionLabel,
  actionHref,
}: HintProps) {
  return (
    <aside
      className={[
        "relative overflow-hidden rounded-[24px] border p-4 shadow-[0_18px_70px_rgba(2,6,23,0.18)] backdrop-blur-2xl sm:p-5",
        toneStyles[tone],
        className,
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.10),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.03),transparent_28%)]" />

      <div className="relative flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/55 shadow-[0_12px_40px_rgba(2,6,23,0.18)]">
          {icon ?? <Sparkles className="h-4.5 w-4.5 text-sky-300" />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-black uppercase tracking-[0.34em] text-slate-400">
              {title}
            </p>
            <Info className="h-3.5 w-3.5 text-slate-500" />
          </div>

          <div className="mt-2 text-sm leading-relaxed text-slate-200">
            {children}
          </div>

          {actionLabel && actionHref ? (
            <a
              href={actionHref}
              className="mt-3 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-sky-300 transition hover:text-sky-200"
            >
              {actionLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          ) : null}
        </div>
      </div>
    </aside>
  );
}