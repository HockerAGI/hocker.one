"use client";

export default function InteractiveBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden z-[-1] bg-slate-50/30">
      {/* Esferas de luz ambiental (Blobs) */}
      <div className="motion-blob-1 absolute left-[5%] top-[8%] h-[400px] w-[400px] rounded-full bg-sky-400/10 blur-[100px]" />
      <div className="motion-blob-2 absolute right-[10%] top-[18%] h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-[120px]" />
      <div className="motion-blob-3 absolute bottom-[10%] left-[28%] h-[450px] w-[450px] rounded-full bg-cyan-400/10 blur-[100px]" />
      
      {/* Cuadrícula arquitectónica con difuminado en los bordes */}
      <div
        className="absolute inset-0 opacity-[0.25]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(148,163,184, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184, 0.4) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          WebkitMaskImage: "radial-gradient(ellipse at 50% 30%, black 20%, transparent 75%)",
          maskImage: "radial-gradient(ellipse at 50% 30%, black 20%, transparent 75%)",
        }}
      />
    </div>
  );
}
