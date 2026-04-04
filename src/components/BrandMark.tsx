import Image from "next/image";
import Link from "next/link";

type BrandMarkProps = {
  href?: string;
  compact?: boolean;
  className?: string;
};

export default function BrandMark({
  href = "/",
  compact = false,
  className = "",
}: BrandMarkProps) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-3 rounded-3xl border border-white/5 bg-white/[0.03] px-3 py-2 shadow-[0_10px_40px_rgba(2,6,23,0.25)] backdrop-blur-xl transition-all hover:border-sky-500/20 hover:bg-white/[0.06] ${className}`}
      aria-label="Ir al inicio"
    >
      <span className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-slate-950/80">
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(14,165,233,0.28),transparent_60%)]" />
        <Image
          src="/brand/hocker-one-isotype.png"
          alt="Hocker"
          width={40}
          height={40}
          priority
          className="relative h-8 w-8 object-contain drop-shadow-[0_0_14px_rgba(14,165,233,0.35)]"
        />
      </span>

      {!compact ? (
        <span className="hidden min-w-0 sm:block">
          <Image
            src="/brand/hocker-one-horizontal.png"
            alt="Hocker One"
            width={240}
            height={52}
            priority
            className="h-9 w-auto object-contain sm:h-10"
          />
        </span>
      ) : null}
    </Link>
  );
}