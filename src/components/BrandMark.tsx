"use client";

import { useState } from "react";
import Image from "next/image"; // Inyectamos el motor de Vercel

type BrandMarkProps = {
  compact?: boolean;
  className?: string;
  showWordmark?: boolean; // true = logo completo, false = isotipo
  hero?: boolean;
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
  hero = false,
}: BrandMarkProps) {
  const [fullIndex, setFullIndex] = useState(0);
  const [isoIndex, setIsoIndex] = useState(0);
  const [broken, setBroken] = useState(false);

  const useFullLogo = showWordmark;
  const candidates = useFullLogo ? FULL_LOGO_CANDIDATES : ISOTYPE_CANDIDATES;
  const currentIndex = useFullLogo ? fullIndex : isoIndex;
  const src = candidates[currentIndex] ?? candidates[0];

  // Estructura matemática optimizada para el renderizado
  const dimensions = {
    frameWidth: useFullLogo ? (hero ? "min(92vw, 920px)" : compact ? "280px" : "460px") : (compact ? "44px" : "60px"),
    frameHeight: useFullLogo ? (hero ? "clamp(130px, 18vw, 220px)" : compact ? "88px" : "132px") : (compact ? "44px" : "60px"),
    padding: useFullLogo ? (hero ? "18px 22px" : compact ? "10px 14px" : "14px 18px") : 0,
    borderRadius: useFullLogo ? 28 : 18,
  };

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
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          width: dimensions.frameWidth,
          height: dimensions.frameHeight,
          borderRadius: dimensions.borderRadius,
          padding: dimensions.padding,
          background: useFullLogo
            ? "linear-gradient(180deg, rgba(2,6,23,.82), rgba(15,23,42,.52))"
            : "linear-gradient(180deg, rgba(255,255,255,.96), rgba(255,255,255,.84))",
          border: useFullLogo
            ? "1px solid rgba(148,163,184,.34)"
            : "1px solid rgba(15,23,42,.10)",
          boxShadow: useFullLogo
            ? "0 26px 84px rgba(0,0,0,.48), 0 0 0 1px rgba(255,255,255,.05), 0 0 80px rgba(56,189,248,.18)"
            : "0 18px 36px rgba(15,23,42,.16), inset 0 1px 0 rgba(255,255,255,.72)",
          overflow: "hidden",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          transform: hero ? "translateZ(0)" : "none",
        }}
      >
        {useFullLogo && (
          <>
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(circle at 18% 20%, rgba(56,189,248,.22), transparent 26%), radial-gradient(circle at 82% 18%, rgba(37,99,235,.16), transparent 24%), radial-gradient(circle at 50% 100%, rgba(14,165,233,.10), transparent 34%)",
                pointerEvents: "none",
              }}
            />
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(135deg, rgba(255,255,255,.18), transparent 25%, transparent 75%, rgba(255,255,255,.08))",
                opacity: 0.7,
                pointerEvents: "none",
              }}
            />
          </>
        )}

        {!broken ? (
          // Contenedor relativo necesario para Next.js Image con layout "fill"
          <div style={{ position: "relative", width: "100%", height: "100%", zIndex: 1 }}>
            <Image
              src={src}
              alt="Hocker ONE Logo"
              fill
              priority={hero} // Carga prioritaria si es el logo principal
              sizes="(max-width: 768px) 100vw, 50vw" // Optimizacion de entrega Vercel
              style={{
                objectFit: "contain",
                filter: useFullLogo
                  ? "drop-shadow(0 12px 26px rgba(0,0,0,.34))"
                  : "drop-shadow(0 8px 12px rgba(0,0,0,.18))",
              }}
              onError={handleLogoError}
            />
          </div>
        ) : (
          <div
            style={{
              position: "relative",
              zIndex: 1,
              width: useFullLogo ? (hero ? 120 : 96) : 44,
              height: useFullLogo ? (hero ? 120 : 96) : 44,
              borderRadius: 18,
              display: "grid",
              placeItems: "center",
              background: "linear-gradient(180deg, #0ea5ff, #2563eb)",
              color: "#fff",
              fontWeight: 900,
              fontSize: hero ? 34 : 22,
              letterSpacing: "-0.06em",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,.18)",
              margin: "auto", // Centrado automático si falla la imagen
            }}
          >
            H
          </div>
        )}
      </div>
    </div>
  );
}
