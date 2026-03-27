"use client";

import Image from "next/image";
import { useState } from "react";

type BrandMarkProps = {
  compact?: boolean;
  className?: string;
  showWordmark?: boolean;
};

export default function BrandMark({
  compact = false,
  className = "",
  showWordmark = true,
}: BrandMarkProps) {
  const [broken, setBroken] = useState(false);

  const size = compact ? 34 : 48;
  const outer = compact ? 42 : 58;
  const logoSrc = "/brand/hocker-one-logo.png";

  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <div
        style={{
          width: outer,
          height: outer,
          borderRadius: 18,
          background:
            "linear-gradient(145deg, rgba(14,165,233,.18), rgba(37,99,235,.12))",
          border: "1px solid rgba(148,163,184,.22)",
          boxShadow:
            "0 18px 36px rgba(15,23,42,.12), inset 0 1px 0 rgba(255,255,255,.65)",
          display: "grid",
          placeItems: "center",
          overflow: "hidden",
        }}
      >
        {!broken ? (
          <Image
            src={logoSrc}
            alt="Hocker ONE"
            width={size}
            height={size}
            priority
            onError={() => setBroken(true)}
            style={{ objectFit: "contain" }}
          />
        ) : (
          <div
            style={{
              width: size,
              height: size,
              borderRadius: 16,
              display: "grid",
              placeItems: "center",
              background: "linear-gradient(180deg, #0ea5ff, #2563eb)",
              color: "#fff",
              fontWeight: 900,
              fontSize: compact ? 18 : 22,
              letterSpacing: "-0.06em",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,.18)",
            }}
          >
            H
          </div>
        )}
      </div>

      {showWordmark ? (
        <div style={{ lineHeight: 0.92 }}>
          <div
            style={{
              fontSize: compact ? 20 : 28,
              fontWeight: 900,
              letterSpacing: "-0.05em",
              color: "#0f172a",
            }}
          >
            Hocker
          </div>
          <div
            style={{
              fontSize: compact ? 16 : 22,
              fontWeight: 900,
              letterSpacing: "-0.05em",
              background: "linear-gradient(90deg, #0ea5ff, #2563eb)",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            ONE
          </div>
        </div>
      ) : null}
    </div>
  );
}