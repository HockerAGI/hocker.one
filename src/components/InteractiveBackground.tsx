"use client";

import { useEffect, useState } from "react";

type Point = {
  x: number;
  y: number;
};

export default function InteractiveBackground() {
  const [point, setPoint] = useState<Point>({ x: 50, y: 35 });

  useEffect(() => {
    const update = (clientX: number, clientY: number) => {
      const x = (clientX / window.innerWidth) * 100;
      const y = (clientY / window.innerHeight) * 100;
      setPoint({ x, y });
    };

    const onMove = (event: PointerEvent) => update(event.clientX, event.clientY);
    const onTouch = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch) return;
      update(touch.clientX, touch.clientY);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("touchmove", onTouch);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#020617_0%,#020617_100%)]" />

      <div
        className="absolute inset-0 opacity-80 transition-transform duration-300 ease-out"
        style={{
          background: `
            radial-gradient(circle at ${point.x}% ${point.y}%, rgba(14,165,233,0.18), transparent 24%),
            radial-gradient(circle at ${100 - point.x}% ${100 - point.y}%, rgba(168,85,247,0.14), transparent 22%),
            radial-gradient(circle at top, rgba(59,130,246,0.06), transparent 32%)
          `,
        }}
      />

      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:44px_44px] opacity-25" />

      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-sky-500/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-slate-950 to-transparent" />

      <div className="absolute -top-28 left-[8%] h-80 w-80 rounded-full bg-sky-500/12 blur-3xl animate-[nova-breathe_10s_ease-in-out_infinite]" />
      <div className="absolute right-[6%] top-[18%] h-[22rem] w-[22rem] rounded-full bg-fuchsia-500/10 blur-3xl animate-[nova-breathe_12s_ease-in-out_infinite]" />
      <div className="absolute bottom-[6%] left-[14%] h-72 w-72 rounded-full bg-cyan-400/8 blur-3xl animate-[nova-breathe_14s_ease-in-out_infinite]" />

      <div className="absolute left-[7%] top-[18%] hidden lg:block nova-mini-card w-44 h-32 animate-[hocker-enter_900ms_var(--hocker-ease)_both]">
        <div className="h-2 w-16 rounded-full bg-sky-400/70" />
        <div className="mt-3 h-2 w-28 rounded-full bg-white/15" />
        <div className="mt-2 h-2 w-20 rounded-full bg-white/10" />
        <div className="mt-5 flex gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          <span className="h-2 w-2 rounded-full bg-sky-400" />
          <span className="h-2 w-2 rounded-full bg-fuchsia-400" />
        </div>
      </div>

      <div className="absolute right-[8%] top-[26%] hidden lg:block nova-mini-card w-52 h-28 animate-[hocker-enter_1100ms_var(--hocker-ease)_both]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
            Live nodes
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-300">
            Realtime
          </span>
        </div>
        <div className="mt-4 h-2 rounded-full bg-white/10" />
        <div className="mt-3 h-2 w-3/4 rounded-full bg-sky-400/30" />
        <div className="mt-3 h-2 w-1/2 rounded-full bg-white/10" />
      </div>

      <div className="absolute bottom-[12%] right-[12%] hidden xl:block nova-mini-card w-56 h-32 animate-[hocker-enter_1300ms_var(--hocker-ease)_both]">
        <div className="text-[10px] font-black uppercase tracking-[0.32em] text-slate-500">
          Nova pulse
        </div>
        <div className="mt-4 flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-70 animate-ping" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-sky-400" />
          </span>
          <div className="h-2 flex-1 rounded-full bg-white/10" />
        </div>
        <div className="mt-4 h-2 w-2/3 rounded-full bg-white/10" />
        <div className="mt-3 h-2 w-1/2 rounded-full bg-sky-400/25" />
      </div>
    </div>
  );
}