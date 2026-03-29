"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

type BrandMarkProps = {
  compact?: boolean;
  className?: string;
  showWordmark?: boolean;
  hero?: boolean;
};

const FULL_LOGOS = ["/brand/hocker-one-logo.png"];
const ISOTYPES = ["/brand/hocker-one-isotype.png"];

function AssetFallback({ wordmark = true, compact = false, hero = false }: { wordmark?: boolean; compact?: boolean; hero?: boolean }) {
  return (
    <div
      className={[
        "flex items-center justify-center rounded-[28px] border border-white/10 bg-white/5 text-white shadow-2xl shadow-black/20 backdrop-blur-xl",
        hero ? "h-20 w-20" : compact ? "h-12 w-12" : "h-16 w-16",
      ].join(" ")}
    >
      <span className={wordmark ? (compact ? "text-xl font-black" : "text-2xl font-black") : "text-xl font-black"}>
        H
      </span>
    </div>
  );
}

export default function BrandMark({
  compact = false,
  className = "",
  showWordmark = true,
  hero = false,
}: BrandMarkProps) {
  const [failed, setFailed] = useState(false);
  const candidates = useMemo(() => (showWordmark ? FULL_LOGOS : ISOTYPES), [showWordmark]);
  const [index, setIndex] = useState(0);

  if (failed) {
    return (
      <div className={`inline-flex items-center gap-3 ${className}`}>
        <AssetFallback wordmark={showWordmark} compact={compact} hero={hero} />
        {showWordmark ? (
          <div className="leading-tight">
            <div className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-sky-300">Hocker One</div>
            <div className="mt-1 text-sm font-semibold text-slate-300">NOVA Core</div>
          </div>
        ) : null}
      </div>
    );
  }

  const src = candidates[index] ?? candidates[0];

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div
        className={[
          "relative overflow-hidden rounded-[28px] border border-white/10 bg-white/5 shadow-2xl shadow-black/20 backdrop-blur-xl",
          hero ? "h-20 w-20" : compact ? "h-12 w-12" : "h-16 w-16",
        ].join(" ")}
      >
        <Image
          src={src}
          alt="Hocker One"
          fill
          className="object-contain p-2 drop-shadow-[0_0_14px_rgba(14,165,233,0.45)]"
          sizes={compact ? "48px" : "64px"}
          priority={hero}
          onError={() => {
            const next = index + 1;
            if (next < candidates.length) {
              setIndex(next);
            } else {
              setFailed(true);
            }
          }}
        />
      </div>

      {showWordmark ? (
        <div className="leading-tight">
          <div className={`${compact ? "text-xs" : "text-[10px]"} font-extrabold uppercase tracking-[0.28em] text-sky-300`}>
            Hocker One
          </div>
          <div className={`${compact ? "mt-1 text-sm" : "mt-1 text-base"} font-semibold text-slate-300`}>
            NOVA Core
          </div>
        </div>
      ) : null}
    </div>
  );
}