"use client";

export default function InteractiveBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.12),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.10),transparent_28%),linear-gradient(180deg,#020617_0%,#020617_100%)]" />
      <div className="absolute -top-24 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-sky-500/10 blur-3xl animate-[pulse_10s_ease-in-out_infinite]" />
      <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-fuchsia-500/10 blur-3xl animate-[pulse_12s_ease-in-out_infinite]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] opacity-40" />
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-sky-500/10 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-sky-400/60 to-transparent opacity-70" />
    </div>
  );
}