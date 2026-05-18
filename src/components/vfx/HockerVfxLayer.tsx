"use client";

import { useEffect, useRef, useState } from "react";

type Particle = {
  x: number;
  y: number;
  z: number;
  speed: number;
  size: number;
};

const PARTICLES = 86;

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function HockerVfxLayer() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("hko:vfx-paused");
    if (saved === "1") setPaused(true);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.hkoVfx = paused ? "paused" : "live";
    window.localStorage.setItem("hko:vfx-paused", paused ? "1" : "0");
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || prefersReducedMotion()) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let running = true;
    let last = performance.now();

    function seedParticles() {
      particlesRef.current = Array.from({ length: PARTICLES }, (_, index) => ({
        x: ((index * 97) % 1000) / 1000,
        y: ((index * 193) % 1000) / 1000,
        z: 0.35 + (((index * 37) % 100) / 100) * 0.9,
        speed: 0.000045 + (index % 7) * 0.000018,
        size: 0.8 + (index % 5) * 0.42,
      }));
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 1.6);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedParticles();
    }

    function draw(now: number) {
      if (!running) return;

      const delta = Math.min(48, now - last);
      last = now;

      ctx.clearRect(0, 0, width, height);

      if (!paused && document.visibilityState === "visible") {
        const cx = width * 0.5;
        const cy = height * 0.42;

        const radial = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(width, height) * 0.76);
        radial.addColorStop(0, "rgba(64, 225, 255, 0.10)");
        radial.addColorStop(0.38, "rgba(67, 56, 202, 0.045)");
        radial.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = radial;
        ctx.fillRect(0, 0, width, height);

        ctx.save();
        ctx.globalCompositeOperation = "lighter";

        for (const p of particlesRef.current) {
          p.y -= p.speed * delta * p.z;
          p.x += Math.sin(now * 0.0004 + p.z * 4) * 0.000018 * delta;

          if (p.y < -0.04) {
            p.y = 1.04;
            p.x = (p.x + 0.37) % 1;
          }

          const px = p.x * width;
          const py = p.y * height;
          const glow = 10 * p.z;

          ctx.beginPath();
          ctx.fillStyle = `rgba(126, 249, 255, ${0.16 + p.z * 0.20})`;
          ctx.shadowColor = "rgba(86,231,255,.85)";
          ctx.shadowBlur = glow;
          ctx.arc(px, py, p.size * p.z, 0, Math.PI * 2);
          ctx.fill();
        }

        for (let i = 0; i < particlesRef.current.length; i += 9) {
          const a = particlesRef.current[i];
          const b = particlesRef.current[(i + 17) % particlesRef.current.length];
          const ax = a.x * width;
          const ay = a.y * height;
          const bx = b.x * width;
          const by = b.y * height;
          const dist = Math.hypot(ax - bx, ay - by);

          if (dist < 240) {
            ctx.strokeStyle = `rgba(86,231,255,${Math.max(0, 0.16 - dist / 1600)})`;
            ctx.lineWidth = 1;
            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.stroke();
          }
        }

        ctx.restore();
      }

      rafRef.current = window.requestAnimationFrame(draw);
    }

    resize();
    rafRef.current = window.requestAnimationFrame(draw);

    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", () => {
      last = performance.now();
    });

    return () => {
      running = false;
      window.removeEventListener("resize", resize);
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, [paused]);

  return (
    <>
      <div className="hko-final-vfx" aria-hidden="true">
        <canvas ref={canvasRef} className="hko-final-canvas" />
        <span className="hko-final-vignette" />
        <span className="hko-final-grid" />
        <span className="hko-final-horizon" />
        <span className="hko-final-orb hko-final-orb-a" />
        <span className="hko-final-orb hko-final-orb-b" />
        <span className="hko-final-orb hko-final-orb-c" />
        <span className="hko-final-ring hko-final-ring-a" />
        <span className="hko-final-ring hko-final-ring-b" />
        <span className="hko-final-beam hko-final-beam-a" />
        <span className="hko-final-beam hko-final-beam-b" />
        <span className="hko-final-comet hko-final-comet-a" />
        <span className="hko-final-comet hko-final-comet-b" />
        <span className="hko-final-scan" />
        <span className="hko-final-film" />
      </div>

      <button
        type="button"
        className="hko-final-vfx-toggle"
        aria-label={paused ? "Activar efectos visuales" : "Pausar efectos visuales"}
        aria-pressed={paused}
        onClick={() => setPaused((value) => !value)}
      >
        {paused ? "VFX ON" : "Pausar VFX"}
      </button>
    </>
  );
}
