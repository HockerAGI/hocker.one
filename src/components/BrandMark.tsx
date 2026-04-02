"use client";

import Image from "next/image";

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type BrandMarkProps = {
  showWordmark?: boolean;
  hero?: boolean;
  className?: string;
};

export default function BrandMark({
  showWordmark = true,
  hero = false,
  className,
}: BrandMarkProps) {
  return (
    <div
      className={cx(
        "flex items-center gap-3 select-none",
        hero ? "scale-110" : "scale-100",
        className,
      )}
    >
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-sky-500/20 blur-xl opacity-70 animate-pulse" />
        <Image
          src="/brand/hocker-one-isotype.png"
          alt="Hocker One"
          width={hero ? 64 : 40}
          height={hero ? 64 : 40}
          className="relative object-contain"
          priority
        />
      </div>

      {showWordmark ? (
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-black tracking-tight text-white">
            HOCKER
          </span>
          <span className="text-[10px] font-black uppercase tracking-[0.25em] text-sky-400">
            ONE
          </span>
        </div>
      ) : null}
    </div>
  );
}