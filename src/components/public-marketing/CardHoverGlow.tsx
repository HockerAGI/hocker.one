"use client";

import { useEffect } from "react";

/**
 * Registers global mousemove delegation for .hko-cap-card elements,
 * updating --mx/--my CSS custom properties for the radial glow effect.
 * Cleanup on unmount. Zero re-renders.
 */
export default function CardHoverGlow() {
  useEffect(() => {
    function handleMove(e: MouseEvent) {
      const target = (e.target as HTMLElement)?.closest<HTMLElement>(".hko-cap-card");
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      target.style.setProperty("--mx", `${x}%`);
      target.style.setProperty("--my", `${y}%`);
    }

    document.addEventListener("mousemove", handleMove, { passive: true });
    return () => document.removeEventListener("mousemove", handleMove);
  }, []);

  return null;
}
