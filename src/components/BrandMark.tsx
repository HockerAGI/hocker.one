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
  href = "/",
  compact = false,
  showWordmark = true,
  hero = false,
  className = "",
}: BrandMarkProps) {
  const shellSize = hero ? "h-14 w-14" : "h-11 w-11";
  const logoSize = hero ? "h-10 w-10" : "h-8 w-8";
  const wordmarkSize = hero ? "h-12 sm:h-14" : "h-9 sm:h-10";

  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-3 rounded-3xl border border-white/5 bg-white/[0.03] px-3 py-2 shadow-[0_10px_40px_rgba(2,6,23,0.25)] backdrop-blur-xl transition-all duration-300 hover:border-sky-500/20 hover:bg-white/[0.06] active:scale-95 ${className}`}
      aria-label="Ir al inicio"
    >
      <span
        className={`relative flex ${shellSize} items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80 transition-transform duration-300 group-hover:scale-105`}
      >
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.28),transparent_60%)] opacity-80 transition-opacity group-hover:opacity-100" />
        <Image
          src="/brand/hocker-one-isotype.png"
          alt="Hocker"
          width={40}
          height={40}
          priority
          className={`relative ${logoSize} object-contain drop-shadow-[0_0_14px_rgba(14,165,233,0.35)]`}
        />
      </span>

      {showWordmark && !compact ? (
        <span className="hidden min-w-0 sm:block">
          <Image
            src="/brand/hocker-one-horizontal.png"
            alt="Hocker One"
            width={240}
            height={52}
            priority
            className={`${wordmarkSize} w-auto object-contain transition-transform duration-300 group-hover:scale-[1.02]`}
          />
        </span>
      ) : null}
    </Link>
  );
}