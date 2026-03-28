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

  const useFullLogo = showWordmark;
  const candidates = useFullLogo ? FULL_LOGO_CANDIDATES : ISOTYPE_CANDIDATES;
  const currentIndex = useFullLogo ? fullIndex : isoIndex;
  const src = candidates[currentIndex] ?? candidates[0];

  const logoSize = useFullLogo ? (compact ? 120 : 180) : compact ? 34 : 44;
  const frameW = useFullLogo ? (compact ? 168 : 236) : compact ? 42 : 58;
  const frameH = useFullLogo ? (compact ? 56 : 72) : compact ? 42 : 58;

  function handleLogoError() {
    if (useFullLogo) {
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
      }}
    >
      <div
        style={{
          width: frameW,
          height: frameH,
          borderRadius: 22,
          display: "grid",
          placeItems: "center",
          padding: useFullLogo ? (compact ? "8px 14px" : "10px 18px") : 0,
          background: useFullLogo
            ? "linear-gradient(180deg, rgba(2,6,23,.18), rgba(2,6,23,.10))"
            : "linear-gradient(180deg, rgba(255,255,255,.94), rgba(255,255,255,.82))",
          border: useFullLogo
            ? "1px solid rgba(148,163,184,.28)"
            : "1px solid rgba(15,23,42,.10)",
          boxShadow: useFullLogo
            ? "0 18px 40px rgba(2,6,23,.30), inset 0 1px 0 rgba(255,255,255,.10)"
            : "0 18px 36px rgba(15,23,42,.16), inset 0 1px 0 rgba(255,255,255,.72)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          overflow: "hidden",
        }}
      >
        {!broken ? (
          <img
            src={src}
            alt="Hocker ONE"
            width={logoSize}
            height={logoSize}
            loading={compact ? "lazy" : "eager"}
            decoding="async"
            onError={handleLogoError}
            style={{
              objectFit: "contain",
              display: "block",
              width: logoSize,
              height: logoSize,
              filter: useFullLogo
                ? "drop-shadow(0 10px 18px rgba(0,0,0,.30))"
                : "drop-shadow(0 8px 12px rgba(0,0,0,.18))",
            }}
          />
        ) : (
          <div
            style={{
              width: useFullLogo ? logoSize : logoSize,
              height: useFullLogo ? logoSize : logoSize,
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