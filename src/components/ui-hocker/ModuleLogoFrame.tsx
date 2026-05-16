import type { ModuleKind } from "@/lib/hocker-dashboard";

function initials(title: string): string {
  return title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

const accentMap: Record<string, string> = {
  cyan: "from-cyan-300/35 via-sky-400/10 to-blue-950/20 text-cyan-100",
  sky: "from-sky-300/35 via-blue-400/10 to-blue-950/20 text-sky-100",
  violet: "from-violet-300/35 via-fuchsia-400/10 to-slate-950/20 text-violet-100",
  emerald: "from-emerald-300/35 via-teal-400/10 to-slate-950/20 text-emerald-100",
  amber: "from-amber-300/35 via-orange-400/10 to-slate-950/20 text-amber-100",
  rose: "from-rose-300/35 via-pink-500/10 to-slate-950/20 text-rose-100",
  pink: "from-pink-300/35 via-fuchsia-400/10 to-slate-950/20 text-pink-100",
};

export default function ModuleLogoFrame({
  title,
  src,
  kind = "app",
  accent = "cyan",
  size = "md",
}: {
  title: string;
  src?: string;
  kind?: ModuleKind;
  accent?: string;
  size?: "sm" | "md" | "lg";
}) {
  const box = size === "lg" ? "h-20 w-20" : size === "sm" ? "h-12 w-12" : "h-16 w-16";
  const img = size === "lg" ? "h-14 w-14" : size === "sm" ? "h-8 w-8" : "h-11 w-11";
  const tone = accentMap[accent] ?? accentMap.cyan;
  const isAgi = kind === "agi" || kind === "nova";

  return (
    <div
      className={[
        "relative flex shrink-0 items-center justify-center overflow-hidden border border-white/10 bg-gradient-to-br shadow-[0_18px_55px_rgba(2,8,23,0.36)]",
        tone,
        box,
        isAgi ? "rounded-full hko-orb-pulse" : "rounded-[24px]",
      ].join(" ")}
    >
      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.22),transparent_38%)]" />
      <span className="pointer-events-none absolute -inset-8 bg-[conic-gradient(from_180deg,transparent,rgba(125,211,252,0.18),transparent,rgba(168,85,247,0.14),transparent)] opacity-80" />
      {src ? (
        <img
          src={src}
          alt={title}
          className={["relative object-contain drop-shadow-[0_0_18px_rgba(103,232,249,0.22)]", img].join(" ")}
          loading="lazy"
        />
      ) : (
        <span className="relative text-sm font-black tracking-[0.16em] sm:text-base">
          {initials(title)}
        </span>
      )}
    </div>
  );
}
