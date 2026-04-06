import type { ReactNode } from "react";

type HintProps = {
  title: string;
  children: ReactNode;
  tone?: "sky" | "rose" | "emerald" | "neutral";
  className?: string;
};

function toneClasses(tone: NonNullable<HintProps["tone"]>): string {
  switch (tone) {
    case "rose":
      return "border-rose-500/15 bg-rose-500/10 text-rose-100";
    case "emerald":
      return "border-emerald-500/15 bg-emerald-500/10 text-emerald-100";
    case "neutral":
      return "border-white/5 bg-white/[0.03] text-slate-100";
    default:
      return "border-sky-500/15 bg-sky-500/10 text-sky-100";
  }
}

function titleTone(tone: NonNullable<HintProps["tone"]>): string {
  switch (tone) {
    case "rose":
      return "text-rose-300";
    case "emerald":
      return "text-emerald-300";
    case "neutral":
      return "text-slate-300";
    default:
      return "text-sky-300";
  }
}

export default function Hint({
  title,
  children,
  tone = "sky",
  className = "",
}: HintProps) {
  return (
    <section
      className={`relative overflow-hidden rounded-[28px] border p-4 sm:p-5 ${toneClasses(tone)} ${className}`}
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