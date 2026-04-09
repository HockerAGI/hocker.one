import Link from "next/link";

type BrandMarkProps = {
  compact?: boolean;
  showWordmark?: boolean;
  href?: string;
  className?: string;
};

function cx(...parts: Array<string | undefined | false>): string {
  return parts.filter(Boolean).join(" ");
}

export default function BrandMark({
  compact = false,
  showWordmark = true,
  href = "/",
  className,
}: BrandMarkProps) {
  const shouldShowWordmark = showWordmark && !compact;

  return (
    <Link
      href={href}
      aria-label="Ir al inicio de Hocker ONE"
      className={cx("group inline-flex items-center gap-3", className)}
    >
      <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-[18px] border border-sky-400/20 bg-slate-950/70 shadow-[0_0_30px_rgba(14,165,233,0.16)] transition-transform duration-300 group-hover:scale-[1.02]">
        <span className="absolute inset-0 rounded-[18px] bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.22),transparent_62%)]" />
        <svg
          viewBox="0 0 64 64"
          className="relative h-8 w-8 drop-shadow-[0_0_14px_rgba(14,165,233,0.35)]"
          fill="none"
          aria-hidden="true"
        >
          <rect x="9" y="9" width="46" height="46" rx="16" stroke="rgba(56,189,248,0.22)" />
          <path
            d="M23 16v32M23 33c0-6.627 5.373-12 12-12s12 5.373 12 12v15"
            stroke="#38BDF8"
            strokeWidth="5.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M23 16h8M23 48h8M35 21h8M35 48h8"
            stroke="rgba(148,163,184,0.32)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </span>

      {shouldShowWordmark ? (
        <span className="hidden min-w-0 sm:block">
          <span className="block text-[10px] font-black uppercase tracking-[0.45em] text-sky-300">
            Hocker One
          </span>
          <span className="block text-[11px] font-medium uppercase tracking-[0.3em] text-slate-500">
            Control Plane
          </span>
        </span>
      ) : null}
    </Link>
  );
}