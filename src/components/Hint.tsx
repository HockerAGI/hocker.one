"use client";

import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";

type HintTone = "sky" | "emerald" | "amber" | "rose" | "violet";

type HintProps = {
  title?: string;
  children: ReactNode;
  tone?: HintTone;
  icon?: ReactNode;
  className?: string;
};

const toneStyles: Record<HintTone, string> = {
  sky: "border-sky-400/15 bg-sky-400/[0.07] text-sky-50",
  emerald: "border-emerald-400/15 bg-emerald-400/[0.07] text-emerald-50",
  amber: "border-amber-400/15 bg-amber-400/[0.07] text-amber-50",
  rose: "border-rose-400/15 bg-rose-400/[0.07] text-rose-50",
  violet: "border-violet-400/15 bg-violet-400/[0.07] text-violet-50",
};

export default function Hint({
  title = "Consejo rápido",
  children,
  tone = "sky",
  icon,
  className = "",
}: HintProps) {
  return (
    <aside
      className={[
        "relative overflow-hidden rounded-[28px] border p-4 sm:p-5",
        "shadow-[0_18px_70px_rgba(2,6,23,0.22)] backdrop-blur-2xl",
        toneStyles[tone],
        className,
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.12),transparent_38%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="relative flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/55 shadow-[0_12px_40px_rgba(2,6,23,0.18)]">
          {icon ?? <Sparkles className="h-4.5 w-4.5 text-sky-300" />}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.34em] text-slate-300/90">
            {title}
          </p>
          <div className="mt-2 text-sm leading-relaxed text-slate-100/90">
            {children}
          </div>
        </div>
      </div>
    </aside>
  );
}