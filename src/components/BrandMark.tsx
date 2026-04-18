"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";

type BrandMarkProps = {
  className?: string;
  compact?: boolean;
  showWordmark?: boolean;
  href?: string;
};

export default function BrandMark({
  className = "",
  compact = false,
  showWordmark = true,
  href = "/dashboard",
}: BrandMarkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-3 rounded-[24px] border border-white/5 bg-white/[0.03] px-4 py-3",
        "shadow-[0_14px_50px_rgba(2,6,23,0.18)] backdrop-blur-2xl transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-400/20 hover:bg-white/[0.05]",
        className,
      )}
      aria-label="Ir al inicio de Hocker ONE"
    >
      <div className={cn(
        "relative flex items-center justify-center rounded-2xl border border-sky-400/15 bg-sky-400/10",
        compact ? "h-10 w-10" : "h-12 w-12",
      )}>
        <div className="absolute inset-0 rounded-2xl bg-sky-400/10 blur-xl opacity-70 transition-opacity duration-300 group-hover:opacity-100" />
        <Sparkles className={cn(
          "relative z-10 text-sky-300 drop-shadow-[0_0_10px_rgba(125,211,252,0.8)]",
          compact ? "h-4.5 w-4.5" : "h-5 w-5",
        )} />
      </div>

      {showWordmark ? (
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.38em] text-sky-300">
            Hocker
          </p>
          <p className={cn(
            "mt-1 truncate font-black text-white tracking-tight",
            compact ? "text-base" : "text-lg",
          )}>
            ONE
          </p>
        </div>
      ) : null}
    </Link>
  );
}