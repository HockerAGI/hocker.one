"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";

function buildParticles() {
  return Array.from({ length: 40 }, (_, index) => ({
    left: `${(index * 23 + 11) % 100}%`,
    top: `${(index * 41 + 17) % 100}%`,
    delay: `${-((index * 0.37) % 9).toFixed(2)}s`,
    duration: `${7 + (index % 9)}s`,
    scale: `${0.55 + (index % 5) * 0.16}`,
    opacity: `${0.18 + (index % 6) * 0.09}`,
  }));
}

export default function HockerVfxLayer() {
  const [paused, setPaused] = useState(false);
  const particles = useMemo(buildParticles, []);

  useEffect(() => {
    document.documentElement.classList.toggle("hko-motion-paused", paused);
    return () => document.documentElement.classList.remove("hko-motion-paused");
  }, [paused]);

  return (
    <>
      <div className="hko-vfx-layer hko-cinema-vfx" aria-hidden="true">
        <span className="hko-vfx-vignette" />
        <span className="hko-vfx-deep hko-vfx-deep-a" />
        <span className="hko-vfx-deep hko-vfx-deep-b" />
        <span className="hko-vfx-deep hko-vfx-deep-c" />
        <span className="hko-vfx-grid" />
        <span className="hko-vfx-aurora hko-vfx-aurora-a" />
        <span className="hko-vfx-aurora hko-vfx-aurora-b" />
        <span className="hko-vfx-ring hko-vfx-ring-a" />
        <span className="hko-vfx-ring hko-vfx-ring-b" />
        <span className="hko-vfx-beam hko-vfx-beam-a" />
        <span className="hko-vfx-beam hko-vfx-beam-b" />
        <span className="hko-vfx-comet hko-vfx-comet-a" />
        <span className="hko-vfx-comet hko-vfx-comet-b" />
        <span className="hko-vfx-comet hko-vfx-comet-c" />
        <span className="hko-vfx-scan" />
        <span className="hko-vfx-film" />
        <span className="hko-vfx-noise" />

        <div className="hko-vfx-particles">
          {particles.map((particle, index) => (
            <span
              key={index}
              style={{
                left: particle.left,
                top: particle.top,
                animationDelay: particle.delay,
                animationDuration: particle.duration,
                opacity: particle.opacity,
                transform: `scale(${particle.scale})`,
              } as CSSProperties}
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        className="hko-motion-toggle"
        aria-pressed={paused}
        aria-label={paused ? "Activar efectos visuales" : "Pausar efectos visuales"}
        onClick={() => setPaused((current) => !current)}
      >
        {paused ? "VFX ON" : "Pausar VFX"}
      </button>
    </>
  );
}
