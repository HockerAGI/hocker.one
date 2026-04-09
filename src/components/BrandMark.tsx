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
  const rootSize = hero ? "gap-4 rounded-[34px] px-4 py-3" : compact ? "gap-3 rounded-[24px] px-2.5 py-2" : "gap-3 rounded-[28px] px-3 py-2";
  const shellSize = hero ? "h-14 w-14 rounded-[22px]" : compact ? "h-10 w-10 rounded-[18px]" : "h-11 w-11 rounded-[20px]";
  const isotypeSize = hero ? 42 : compact ? 28 : 34;
  const wordmarkWidth = hero ? 276 : 224;
  const wordmarkHeight = hero ? 58 : 46;

  return (
    <Link
      href={href}
      aria-label="Ir al inicio de Hocker One"
      className={[
        "group inline-flex items-center border border-white/5 bg-white/[0.03] shadow-[0_12px_50px_rgba(2,6,23,0.28)] backdrop-blur-2xl transition-all duration-300 hover:border-sky-500/20 hover:bg-white/[0.06] active:scale-[0.98]",
        rootSize,
        className,
      ].join(" ")}
    >
      <span
        className={[
          "relative flex shrink-0 items-center justify-center overflow-hidden border border-white/10 bg-slate-950/85 shadow-[0_0_0_1px_rgba(14,165,233,0.12),0_18px_50px_rgba(2,6,23,0.28)] transition-transform duration-300 group-hover:scale-[1.03]",
          shellSize,
        ].join(" ")}
      >
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.32),transparent_62%)]" />
        <Image
          src="/brand/hocker-one-isotype.png"
          alt="Hocker One"
          width={isotypeSize}
          height={isotypeSize}
          priority
          className="relative object-contain drop-shadow-[0_0_14px_rgba(14,165,233,0.38)]"
        />
      </span>

      {showWordmark && !compact ? (
        <span className="hidden min-w-0 sm:block">
          <Image
            src="/brand/hocker-one-logo.png"
            alt="Hocker One"
            width={wordmarkWidth}
            height={wordmarkHeight}
            priority
            className={[
              "h-auto w-auto object-contain transition-transform duration-300 group-hover:scale-[1.01]",
              hero ? "max-h-[58px]" : "max-h-[46px]",
            ].join(" ")}
          />
        </span>
      ) : null}
    </Link>
  );
}