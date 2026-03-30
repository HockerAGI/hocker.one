"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

type BrandMarkProps = {
  compact?: boolean;
  className?: string;
  showWordmark?: boolean;
  hero?: boolean;
};

const FULL_LOGO = "/brand/hocker-one-logo.png";
const ISOTYPE = "/brand/hocker-one-isotype.png";

function AssetFallback({
  wordmark = true,
  compact = false,
  hero = false,
}: {
  wordmark?: boolean;
  compact?: boolean;
  hero?: boolean;
}) {
  if (hero) {
    return (
      <div className="grid gap-3 sm:grid-cols-[auto,1fr]">
        <div className="flex h-24 w-24 items-center justify-center rounded-[30px] border border-sky-400/20 bg-slate-950/80 text-white shadow-[0_0_32px_rgba(14,165,233,0.18)] sm:h-28 sm:w-28">
          <span className="text-3xl font-black text-sky-300">H</span>
        </div>
        <div className="rounded-[28px] border border-white/10 bg-white/5 px-4 py-4 shadow-xl shadow-black/20 backdrop-blur-xl sm:px-5">
          <div className="text-2xl font-black tracking-tight text-white">Hocker One</div>
          <div className="mt-2 text-sm font-semibold uppercase tracking-[0.28em] text-sky-300">
            NOVA Core
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={[
        "flex items-center justify-center rounded-[28px] border border-white/10 bg-white/5 text-white shadow-2xl shadow-black/20 backdrop-blur-xl",
        compact ? "h-12 w-12" : "h-16 w-16",
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
  const candidates = useMemo(() => (showWordmark ? [FULL_LOGO, ISOTYPE] : [ISOTYPE, FULL_LOGO]), [showWordmark]);
  const [index, setIndex] = useState(0);

  const shellClass = ["inline-flex items-center gap-3", className].filter(Boolean).join(" ");

  if (failed) {
    return hero ? (
      <AssetFallback hero />
    ) : (
      <div className={shellClass}>
        <AssetFallback wordmark={showWordmark} compact={compact} />
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

  if (hero) {
    return (
      <div className={`flex flex-col gap-4 ${className}`.trim()}>
        <div className="grid gap-3 sm:grid-cols-[auto,1fr]">
          <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-[30px] border border-sky-400/20 bg-slate-950/90 p-3 shadow-[0_0_32px_rgba(14,165,233,0.28)] sm:h-28 sm:w-28">
            <Image
              src={ISOTYPE}
              alt="Hocker One isotipo"
              width={160}
              height={160}
              className="h-full w-full object-contain drop-shadow-[0_0_18px_rgba(14,165,233,0.55)]"
              priority
              onError={() => setFailed(true)}
            />
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 px-4 py-4 shadow-xl shadow-black/20 backdrop-blur-xl sm:px-5">
            <Image
              src={FULL_LOGO}
              alt="Hocker One logotipo"
              width={360}
              height={126}
              className="h-12 w-auto drop-shadow-[0_0_18px_rgba(14,165,233,0.35)] sm:h-16"
              priority
              onError={() => setFailed(true)}
            />

            <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.28em] text-sky-300">
              <span>Hocker One</span>
              <span className="h-px w-8 bg-sky-400/40" />
              <span>NOVA Core</span>
              <span className="h-1 w-1 rounded-full bg-sky-400 animate-pulse" />
            </div>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
              Centro operativo para gobernanza, chat, supply, seguridad y automatización del ecosistema.
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 self-start rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-300">
          <span className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
          Hocker One / Omni-Sync
        </div>
      </div>
    );
  }

  const src = candidates[index] ?? candidates[0];

  return (
    <div className={shellClass}>
      <div
        className={[
          "relative overflow-hidden border border-white/10 bg-white/5 shadow-2xl shadow-black/20 backdrop-blur-xl",
          showWordmark
            ? "rounded-[22px] px-3 py-2"
            : "flex h-12 w-12 items-center justify-center rounded-[24px] p-1.5",
          compact && showWordmark ? "min-w-[140px] sm:min-w-[170px]" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {showWordmark ? (
          <Image
            src={src}
            alt="Hocker One"
            width={320}
            height={112}
            className={
              compact
                ? "h-10 w-auto drop-shadow-[0_0_14px_rgba(14,165,233,0.4)]"
                : "h-12 w-auto drop-shadow-[0_0_14px_rgba(14,165,233,0.4)]"
            }
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
        ) : (
          <Image
            src={src}
            alt="Hocker One isotipo"
            width={72}
            height={72}
            className="h-full w-full object-contain p-0.5 drop-shadow-[0_0_14px_rgba(14,165,233,0.45)]"
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
        )}
      </div>

      {showWordmark && !compact ? (
        <div className="leading-tight">
          <div className="text-[10px] font-extrabold uppercase tracking-[0.28em] text-sky-300">
            Hocker One
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-300">NOVA Core</div>
        </div>
      ) : null}
    </div>
  );
}