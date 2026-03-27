import React from "react";
import AppNav from "@/components/AppNav";
import BrandMark from "@/components/BrandMark";

type PageShellProps = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  badge?: string;
};

export default function PageShell({
  title,
  subtitle,
  actions,
  children,
  badge,
}: PageShellProps) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(56,189,248,.18), transparent 28%), radial-gradient(circle at top right, rgba(37,99,235,.12), transparent 24%), linear-gradient(180deg, #020617 0%, #07111f 45%, #0b1220 100%)",
        color: "#e2e8f0",
      }}
    >
      <AppNav />

      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 20px 48px" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "end",
              justifyContent: "space-between",
              gap: 16,
              flexWrap: "wrap",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ marginBottom: 14 }}>
                <BrandMark compact />
              </div>

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 12px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,.04)",
                  border: "1px solid rgba(148,163,184,.16)",
                  color: "#cbd5e1",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                <span>Control Plane</span>
                {badge ? <span>· {badge}</span> : null}
              </div>

              <h1
                style={{
                  margin: "14px 0 0",
                  fontSize: "clamp(2rem, 4vw, 3.4rem)",
                  lineHeight: 0.96,
                  letterSpacing: "-0.06em",
                  color: "#f8fafc",
                  fontWeight: 950,
                }}
              >
                {title}
              </h1>

              {subtitle ? (
                <p
                  style={{
                    marginTop: 10,
                    maxWidth: 860,
                    color: "#94a3b8",
                    fontSize: 15,
                    lineHeight: 1.7,
                  }}
                >
                  {subtitle}
                </p>
              ) : null}
            </div>

            {actions ? (
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                {actions}
              </div>
            ) : null}
          </div>

          <section
            style={{
              borderRadius: 28,
              border: "1px solid rgba(148,163,184,.16)",
              background: "rgba(2,6,23,.62)",
              boxShadow: "0 24px 60px rgba(2,6,23,.36)",
              backdropFilter: "blur(18px)",
              padding: 18,
            }}
          >
            {children}
          </section>
        </div>
      </main>
    </div>
  );
}