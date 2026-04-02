"use client";

export default function InteractiveBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden bg-slate-950">
      <div className="absolute left-[5%] top-[10%] h-[500px] w-[500px] rounded-full bg-sky-500/10 blur-[120px] animate-pulse-slow" />
      <div className="absolute right-[5%] top-[20%] h-[600px] w-[600px] rounded-full bg-blue-600/10 blur-[150px] animate-float" />
      <div className="absolute bottom-[10%] left-[20%] h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[130px] animate-pulse-slow" />

      <div
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(148,163,184,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.2) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 50%, black 20%, transparent 80%)",
          maskImage: "radial-gradient(ellipse at 50% 50%, black 20%, transparent 80%)",
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/50 to-slate-950/90" />
    </div>
  );
}