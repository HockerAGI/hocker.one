"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

type BrandMarkProps = {
  compact?: boolean;
  showWordmark?: boolean;
  hero?: boolean;
  className?: string;
};

// COMPONENTE DE RESPALDO ORIGINAL RECUPERADO
function AssetFallback({ wordmark = true }: { wordmark?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-sky-400/20 bg-slate-950/80 text-sky-400 font-black shadow-[0_0_15px_rgba(14,165,233,0.1)]">H</div>
      {wordmark && <div className="text-sm font-black tracking-tighter text-white">HOCKER ONE</div>}
    </div>
  );
}

export default function BrandMark({ compact = false, showWordmark = true, hero = false, className = "" }: BrandMarkProps) {
  const [failed, setFailed] = useState(false);
  const [index, setIndex] = useState(0);

  // LÓGICA DE CANDIDATOS ORIGINAL RECUPERADA
  const candidates = useMemo(() => {
    return showWordmark ? ["/brand/hocker-one-logo.png"] : ["/brand/hocker-one-isotype.png"];
  }, [showWordmark]);

  if (failed) return <AssetFallback wordmark={showWordmark} />;

  return (
    <div className={`flex items-center gap-3 ${className} ${compact ? "scale-90 origin-left" : ""}`}>
      <div className="relative group">
        <div className="absolute inset-0 bg-sky-400 blur-2xl opacity-10 group-hover:opacity-30 transition-opacity" />
        <Image 
          src={candidates[index]} 
          alt="Hocker One" 
          width={showWordmark ? 180 : 48} 
          height={48} 
          className={`relative drop-shadow-[0_0_12px_rgba(14,165,233,0.3)] ${compact ? 'h-8 w-auto' : 'h-10 w-auto'}`}
          priority={hero}
          onError={() => {
            if (index + 1 < candidates.length) setIndex(index + 1);
            else setFailed(true);
          }}
        />
      </div>
    </div>
  );
}
