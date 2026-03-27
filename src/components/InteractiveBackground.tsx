"use client";

export default function InteractiveBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="motion-blob-1 absolute left-[5%] top-[8%] h-72 w-72 rounded-full bg-sky-500/18 blur-3xl" />
      <div className="motion-blob-2 absolute right-[10%] top-[18%] h-80 w-80 rounded-full bg-blue-500/14 blur-3xl" />
      <div className="motion-blob-3 absolute bottom-[10%] left-[28%] h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(148,163,184,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.18) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />
    </div>
  );
}
