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
  cyan: "hko-logo-cyan text-cyan-100",
  sky: "hko-logo-sky text-sky-100",
  violet: "hko-logo-violet text-violet-100",
  emerald: "hko-logo-emerald text-emerald-100",
  amber: "hko-logo-amber text-amber-100",
  rose: "hko-logo-rose text-rose-100",
  pink: "hko-logo-pink text-pink-100",
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
  const box = size === "lg" ? "h-[92px] w-[92px]" : size === "sm" ? "h-[52px] w-[52px]" : "h-[74px] w-[74px]";
  const stage = size === "lg" ? "h-[76px] w-[76px]" : size === "sm" ? "h-[42px] w-[42px]" : "h-[60px] w-[60px]";
  const img = size === "lg" ? "max-h-[62px] max-w-[62px]" : size === "sm" ? "max-h-[34px] max-w-[34px]" : "max-h-[50px] max-w-[50px]";
  const tone = accentMap[accent] ?? accentMap.cyan;
  const isAgi = kind === "agi" || kind === "nova";

  return (
    <div
      className={[
        "hko-logo-frame relative flex shrink-0 items-center justify-center overflow-hidden",
        box,
        tone,
        isAgi ? "rounded-full hko-orb-pulse" : "rounded-[24px]",
      ].join(" ")}
    >
      <span className="hko-logo-aura" />
      <span className={[
        "hko-logo-stage relative z-10 flex items-center justify-center overflow-hidden",
        stage,
        isAgi ? "rounded-full" : "rounded-[20px]",
      ].join(" ")}
      >
        {src ? (
          <img
            src={src}
            alt={`${title} isotipo`}
            className={["hko-logo-img object-contain", img].join(" ")}
            loading="lazy"
          />
        ) : (
          <span className="relative text-base font-black tracking-[0.08em] sm:text-lg">{initials(title)}</span>
        )}
      </span>
    </div>
  );
}
