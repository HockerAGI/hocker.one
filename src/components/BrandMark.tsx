"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

type BrandMarkProps = {
  compact?: boolean;
  className?: string;
  showWordmark?: boolean;
  hero?: boolean;
};

// COMPONENTE DE RESPALDO (Cero 'any', 100% blindado)
function AssetFallback({
  wordmark = true,
  hero = false,
}: {
  wordmark?: boolean;
  hero?: boolean;
}) {
  if (hero) {
    return (
      <div className="flex flex-col items-center gap-4 animate-in fade-in">
        <div className="flex h-20 w-20 items-center justify-center rounded-[24px] border border-sky-400/20 bg-slate-950/80 text-white shadow-[0_0_30px_rgba(14,165,233,0.2)]">
          <span className="text-4xl font-black text-sky-400">H</span>
        </div>
        {wordmark && (
          <div className="text-xl font-black tracking-tighter text-white uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
            Hocker ONE
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 animate-in fade-in">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-400/20 bg-slate-950/80 shadow-[0_0_15px_rgba(14,165,233,0.15)]">
        <span className="text-lg font-black text-sky-400">H</span>
      </div>
      {wordmark && (
        <div className="text-sm font-black tracking-tighter text-white uppercase">
          Hocker ONE
        </div>
      )}
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
  const [index, setIndex] = useState(0);

  const candidates = useMemo(() => {
    return showWordmark ? ["/brand/hocker-one-logo.png"] : ["/brand/hocker-one-isotype.png"];
  }, [showWordmark]);

  if (failed) return <AssetFallback wordmark={showWordmark} hero={hero} />;

  return (
    <div className={`relative flex items-center justify-center group ${className}`}>
      {/* Halo holográfico trasero para destacar la identidad */}
      <div className="absolute inset-0 bg-sky-500 blur-3xl opacity-10 group-hover:opacity-30 transition-opacity duration-700" />
      
      <Image
        src={candidates[index]}
        alt="Hocker One"
        width={showWordmark ? 320 : 72}
        height={showWordmark ? 112 : 72}
        className={`relative object-contain drop-shadow-[0_0_15px_rgba(14,165,233,0.4)] ${
          compact ? "h-8 w-auto" : hero ? "h-20 w-auto" : "h-12 w-auto"
        }`}
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
  );
}
