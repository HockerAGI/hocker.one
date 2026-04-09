"use client";

import type { ReactNode } from "react";

type HintTone = "sky" | "emerald" | "rose" | "violet" | "slate";

type HintProps = {
  title: string;
  children: ReactNode;
  tone?: HintTone;
  className?: string;
};

const TONE_STYLES: Record<
  HintTone,
  {
    chip: string;
    ring: string;
    glow: string;
  }
> = {
  sky: {
    chip: "border-sky-400/20 bg-sky-500/10 text-sky-300",
    ring: "ring-sky-400/10",
    glow: "from-sky-500/12 via-sky-500/5 to-transparent",
  },
  emerald: {
    chip: "border-emerald-400/20 bg-emerald-500/10 text-emerald-300",
    ring: "ring-emerald-400/10",
    glow: "from-emerald-500/12 via-emerald-500/5 to-transparent",
  },
  rose: {
    chip: "border-rose-400/20 bg-rose-500/10 text-rose-300",
    ring: "ring-rose-400/10",
    glow: "from-rose-500/12 via-rose-500/5 to-transparent",
  },
  violet: {
    chip: "border-violet-400/20 bg-violet-500/10 text-violet-300",
    ring: "ring-violet-400/10",
    glow: "from-violet-500/12 via-violet-500/5 to-transparent",
  },
  slate: {
    chip: "border-white/10 bg-white/[0.04] text-slate-300",
    ring: "ring-white/10",
    glow: "from-white/8 via-white/[0.04] to-transparent",
  },
};

export default function Hint({
  title,
  children,
  tone = "sky",
  className = "",
}: HintProps) {
  const style = TONE_STYLES[tone];

  return (
    <section
      className={`relative overflow-hidden rounded-[28px] border border-white/5 bg-white/[0.03] p-4 shadow-[0_18px_70px_rgba(2,6,23,0.16)] backdrop-blur-2xl sm:p-5 ${className}`}
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${style.glow} opacity-100`}
      />
      <div className={`pointer-events-none absolute inset-0 rounded-[28px] ring-1 ${style.ring}`} />

      <div className="relative flex items-start gap-4">
        <div className={`mt-0.5 h-3 w-3 shrink-0 rounded-full border ${style.chip}`} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-200">
              {title}
            </p>
            <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.28em] ${style.chip}`}>
              Hocker ONE
            </span>
          </div>

          <div className="mt-2 text-sm leading-relaxed text-slate-400 sm:text-[15px]">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}