"use client";

import { useState } from "react";

type BrandMarkProps = {
  compact?: boolean;
  className?: string;
  showWordmark?: boolean;
};

const FULL_LOGO_CANDIDATES = [
  "/brand/hocker-one-logo.png",
  "/brand/hocker-one-logo.svg",
];

const ISOTYPE_CANDIDATES = [
  "/brand/hocker-one-isotype.png",
  "/brand/hocker-one-isotype.svg",
];

export default function BrandMark({
  compact = false,
  className = "",
  showWordmark = true,
}: BrandMarkProps) {
  const [fullIndex, setFullIndex] = useState(0);
  const [isoIndex, setIsoIndex] = useState(0);
  const [broken, setBroken] = useState(false);

  const isFullLogo = showWordmark;
  const candidates = isFullLogo ? FULL_LOGO_CANDIDATES : ISOTYPE_CANDIDATES;
  const currentIndex = isFullLogo ? fullIndex : isoIndex;
  const src = candidates[currentIndex] ?? candidates[0];

  const size = compact ? (showWordmark ? 34 : 30) : showWordmark ? 52 : 40;
  const outer = compact ? (showWordmark ? 46 : 42) : showWordmark ? 68 : 54;

  function handleLogoError() {
    if (isFullLogo) {
      setFullIndex((i) => {
        const next = i + 1;
        if (next < FULL_LOGO_CANDIDATES.length) return next;
        setBroken(true);
        return i;
      });
      return;
    }

    setIsoIndex((i) => {
      const next = i + 1;
      if (next < ISOTYPE_CANDIDATES.length) return next;
      setBroken(true);
      return i;
    });
  }

  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: showWordmark ? 12 : 0,
      }}
    >
      <div
        style={{
          width: outer,
          height: outer,
          borderRadius: 18,
          background:
            "linear-gradient(180deg, rgba(255,255,255,.96), rgba(255,255,255,.82))",
          border: "1px solid rgba(15,23,42,.10)",
          boxShadow:
            "0 18px 36px rgba(15,23,42,.16), inset 0 1px 0 rgba(255,255,255,.72)",
          display: "grid",
          placeItems: "center",
          overflow: "hidden",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
        }}
      >
        {!broken ? (
          <img
            src={src}
            alt="Hocker ONE"
            width={size}
            height={size}
            loading={compact ? "lazy" : "eager"}
            decoding="async"
            onError={handleLogoError}
            style={{
              objectFit: "contain",
              display: "block",
              width: size,
              height: size,
            }}
          />
        ) : (
          <div
            style={{
              width: size,
              height: size,
              borderRadius: 16,
              display: "grid",
              placeItems: "center",
              background: "linear-gradient(180deg, #0ea5ff, #2563eb)",
              color: "#fff",
              fontWeight: 900,
              fontSize: compact ? 18 : 22,
              letterSpacing: "-0.06em",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,.18)",
            }}
          >
            H
          </div>
        )}
      </div>
    </div>
  );
}