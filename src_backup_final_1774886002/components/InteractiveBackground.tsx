"use client";

export default function InteractiveBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden bg-slate-950">
      <div className="absolute left-[6%] top-[8%] h-[420px] w-[420px] rounded-full bg-sky-500/10 blur-[120px]" />
      <div className="absolute right-[8%] top-[16%] h-[520px] w-[520px] rounded-full bg-blue-500/10 blur-[140px]" />
      <div className="absolute bottom-[8%] left-[24%] h-[460px] w-[460px] rounded-full bg-cyan-500/10 blur-[120px]" />
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(148,163,184,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.35) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 30%, black 16%, transparent 76%)",
          maskImage: "radial-gradient(ellipse at 50% 30%, black 16%, transparent 76%)",
        }}
      />
    </div>
  );
}