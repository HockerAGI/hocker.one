"use client";

import React from "react";

type HintTone = "sky" | "emerald" | "amber" | "rose";

type HintProps = {
  title: string;
  children: React.ReactNode;
  tone?: HintTone;
};

function toneStyles(tone: HintTone): string {
  switch (tone) {
    case "emerald":
      return "border-emerald-500/15 bg-emerald-500/8 text-emerald-100";
    case "amber":
      return "border-amber-500/15 bg-amber-500/8 text-amber-100";
    case "rose":
      return "border-rose-500/15 bg-rose-500/8 text-rose-100";
    case "sky":
    default:
      return "border-sky-500/15 bg-sky-500/8 text-sky-100";
  }
}

function titleTone(tone: HintTone): string {
  switch (tone) {
    case "emerald":
      return "text-emerald-300";
    case "amber":
      return "text-amber-300";
    case "rose":
      return "text-rose-300";
    case "sky":
    default:
      return "text-sky-300";
  }
}

export default function Hint({
  title,
  children,
  tone = "sky",
}: HintProps) {
  return (
    <section
      className={`relative overflow-hidden rounded-[28px] border px-4 py-4 shadow-[0_16px_60px_rgba(2,6,23,0.18)] backdrop-blur-2xl sm:px-5 sm:py-5 ${toneStyles(
        tone,
      )}`}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_32%)] opacity-80" />
      <div className="relative flex items-start gap-3">
        <span
          className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/50 text-[10px] font-black uppercase tracking-widest ${titleTone(
            tone,
          )}`}
          aria-hidden="true"
        >
          i
        </span>

        <div className="min-w-0">
          <p
            className={`text-[10px] font-black uppercase tracking-[0.35em] ${titleTone(
              tone,
            )}`}
          >
            {title}
          </p>
          <p className="mt-2 text-[11px] leading-relaxed text-slate-300 sm:text-sm">
            {children}
          </p>
        </div>
      </div>
    </section>
  );
}