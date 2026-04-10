import Image from "next/image";
import Link from "next/link";

type BrandMarkProps = {
  href?: string;
  compact?: boolean;
  showWordmark?: boolean;
  hero?: boolean;
  className?: string;
};

export default function BrandMark({
  href = "/dashboard",
  compact = false,
  showWordmark = true,
  hero = false,
  className = "",
}: BrandMarkProps) {
  const shellClass = hero
    ? "rounded-[28px] border border-white/5 bg-white/[0.02] px-4 py-3 shadow-[0_18px_60px_rgba(2,6,23,0.25)] backdrop-blur-2xl"
    : compact
      ? "rounded-[22px] border border-white/5 bg-white/[0.03] px-3 py-2 shadow-[0_12px_40px_rgba(2,6,23,0.18)] backdrop-blur-xl"
      : "rounded-[26px] border border-white/5 bg-white/[0.03] px-3 py-2.5 shadow-[0_16px_50px_rgba(2,6,23,0.2)] backdrop-blur-xl";

  const isotypeSize = hero ? 58 : compact ? 30 : 36;
  const wordmarkWidth = hero ? 360 : 220;
  const wordmarkHeight = hero ? 104 : 64;

  return (
    <Link
      href={href}
      aria-label="Ir al inicio"
      className={[
        "group inline-flex items-center gap-3 transition-all duration-300",
        hero ? "hover:translate-y-[-1px]" : "hover:border-sky-400/15 hover:bg-white/[0.05]",
        shellClass,
        className,
      ].join(" ")}
    >
      <span
        className={[
          "relative flex items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80 transition-transform duration-300 group-hover:scale-[1.03]",
          hero ? "h-16 w-16 sm:h-20 sm:w-20" : compact ? "h-10 w-10" : "h-11 w-11",
        ].join(" ")}
      >
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.28),transparent_60%)] opacity-90 transition-opacity group-hover:opacity-100" />
        <Image
          src="/brand/hocker-one-isotype.png"
          alt="Hocker ONE"
          width={isotypeSize}
          height={isotypeSize}
          priority
          className="relative object-contain drop-shadow-[0_0_16px_rgba(14,165,233,0.35)]"
        />
      </span>

      {showWordmark && !compact ? (
        <span className="hidden min-w-0 sm:block">
          <Image
            src="/brand/hocker-one-logo.png"
            alt="Hocker ONE"
            width={wordmarkWidth}
            height={wordmarkHeight}
            priority
            className={[
              "h-auto w-auto object-contain transition-all duration-300 drop-shadow-[0_0_22px_rgba(14,165,233,0.16)]",
              hero ? "max-w-[340px] sm:max-w-[360px]" : "max-w-[220px] lg:max-w-[240px]",
            ].join(" ")}
          />
        </span>
      ) : null}
    </Link>
  );
}
