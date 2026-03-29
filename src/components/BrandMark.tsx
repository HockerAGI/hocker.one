"use client";

import { useState } from "react";
import Image from "next/image";

type BrandMarkProps = {
  compact?: boolean;
  className?: string;
  showWordmark?: boolean; // true = logo completo, false = isotipo
  hero?: boolean;
};

// Rutas exactas a tus activos visuales premium
const FULL_LOGO_CANDIDATES = [
  "/brand/logo-hocker-one.png",
  "/brand/hocker-one-logo.png", 
];

const ISOTYPE_CANDIDATES = [
  "/brand/hocker-one-isotype.png",
  "/brand/1794.png", 
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

  // Proporciones matemáticas de grado Enterprise (Adaptables a celular y PC)
  const getDimensions = () => {
    if (useFullLogo) {
      if (hero) return "w-[240px] h-[70px] md:w-[320px] md:h-[90px]";
      if (compact) return "w-[120px] h-[32px]";
      return "w-[160px] h-[44px]";
    } else {
      if (hero) return "w-[72px] h-[72px] md:w-[96px] md:h-[96px]";
      if (compact) return "w-[32px] h-[32px]";
      return "w-[48px] h-[48px]";
    }
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
    <div className={`relative flex items-center justify-center transition-all duration-300 ${className} ${getDimensions()}`}>
      {!broken ? (
        // El logo transparente flotando elegantemente
        <Image
          src={src}
          alt="Hocker ONE"
          fill
          priority={hero || compact} // Carga inmediata en zonas críticas
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-contain drop-shadow-sm"
          onError={handleLogoError}
        />
      ) : (
        // El Escudo de Emergencia (Mismo diseño premium que tu icono de App)
        <div className="flex h-full w-full items-center justify-center rounded-[22%] bg-gradient-to-br from-sky-400 via-blue-600 to-blue-800 text-white shadow-inner">
          <span 
            className="font-black tracking-tighter" 
            style={{ fontSize: useFullLogo ? (compact ? '1rem' : '1.5rem') : (compact ? '1.2rem' : '2rem') }}
          >
            H
          </span>
        </div>
      )}
    </div>
  );
}
