import AuthBox from "@/components/AuthBox";
import BrandMark from "@/components/BrandMark";
import Link from "next/link";

const modules = [
  {
    title: "Dashboard",
    desc: "Telemetría, seguridad, nodos y eventos en un solo lugar.",
  },
  {
    title: "Chat NOVA",
    desc: "Entrada operativa con la IA central del ecosistema.",
  },
  {
    title: "Commands",
    desc: "Cola de acciones, aprobaciones y ejecución controlada.",
  },
  {
    title: "Nodes",
    desc: "Visibilidad de agentes físicos y nodos cloud.",
  },
  {
    title: "AGIs",
    desc: "Jerarquía de agentes especializados del sistema.",
  },
  {
    title: "Supply",
    desc: "Productos, órdenes y operación interna.",
  },
];

export default function HomePage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(56,189,248,.14), transparent 24%), radial-gradient(circle at top right, rgba(37,99,235,.12), transparent 22%), linear-gradient(180deg, #020617 0%, #07111f 46%, #0b1220 100%)",
        color: "#e2e8f0",
      }}
    >
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "24px 20px 56px" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 22,
            alignItems: "stretch",
          }}
        >
          <section
            style={{
              padding: 30,
              borderRadius: 32,
              border: "1px solid rgba(148,163,184,.16)",
              background: "rgba(2,6,23,.58)",
              boxShadow: "0 24px 64px rgba(2,6,23,.36)",
              backdropFilter: "blur(16px)",
            }}
          >
            <BrandMark />

            <div style={{ marginTop: 22 }}>
              <div
                style={{
                  display: "inline-flex",
                  gap: 8,
                  alignItems: "center",
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: "1px solid rgba(56,189,248,.22)",
                  background: "rgba(56,189,248,.08)",
                  color: "#bae6fd",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                Control Plane · Vercel + Supabase + NOVA
              </div>

              <h1
                style={{
                  margin: "18px 0 0",
                  fontSize: "clamp(2.4rem, 5vw, 4.8rem)",
                  lineHeight: 0.95,
                  letterSpacing: "-0.07em",
                  fontWeight: 950,
                  color: "#f8fafc",
                }}
              >
                Un panel que sí se siente <span style={{ color: "#38bdf8" }}>Hocker</span>.
              </h1>

              <p
                style={{
                  marginTop: 16,
                  maxWidth: 720,
                  color: "#94a3b8",
                  fontSize: 16,
                  lineHeight: 1.8,
                }}
              >
                Entra con tu correo y abre el control plane. Aquí conviven seguridad, nodos,
                comandos, supply, AGIs y la puerta a NOVA. Nada de demo falsa: panel real,
                backend real, despliegue real.
              </p>

              <div
                style={{
                  marginTop: 22,
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <Link
                  href="/dashboard"
                  style={{
                    padding: "12px 18px",
                    borderRadius: 999,
                    background: "linear-gradient(90deg, #38bdf8, #2563eb)",
                    color: "#fff",
                    textDecoration: "none",
                    fontWeight: 900,
                    boxShadow: "0 18px 34px rgba(37,99,235,.28)",
                  }}
                >
                  Ir al dashboard
                </Link>
                <Link
                  href="/chat"
                  style={{
                    padding: "12px 18px",
                    borderRadius: 999,
                    border: "1px solid rgba(148,163,184,.18)",
                    background: "rgba(255,255,255,.04)",
                    color: "#e2e8f0",
                    textDecoration: "none",
                    fontWeight: 800,
                  }}
                >
                  Abrir NOVA
                </Link>
              </div>
            </div>

            <div
              style={{
                marginTop: 28,
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 12,
              }}
            >
              {[
                ["Supabase", "Auth + DB + RLS"],
                ["Vercel", "Deploy y edge"],
                ["NOVA", "Orquestación"],
                ["HMAC", "Zero-trust"],
              ].map(([title, desc]) => (
                <div
                  key={title}
                  style={{
                    borderRadius: 20,
                    border: "1px solid rgba(148,163,184,.14)",
                    background: "rgba(15,23,42,.55)",
                    padding: 16,
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 900, color: "#f8fafc" }}>{title}</div>
                  <div style={{ marginTop: 6, fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>
                    {desc}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section
            style={{
              padding: 30,
              borderRadius: 32,
              border: "1px solid rgba(148,163,184,.16)",
              background: "rgba(2,6,23,.42)",
              boxShadow: "0 24px 64px rgba(2,6,23,.28)",
              backdropFilter: "blur(16px)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                marginBottom: 16,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div style={{ fontSize: 13, color: "#94a3b8", fontWeight: 700 }}>
                  Autenticación segura
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#f8fafc" }}>
                  Login directo
                </div>
              </div>
              <div
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  background: "rgba(16,185,129,.10)",
                  color: "#6ee7b7",
                  border: "1px solid rgba(16,185,129,.22)",
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                Live on Vercel
              </div>
            </div>

            <AuthBox />

            <div
              style={{
                marginTop: 18,
                borderRadius: 20,
                border: "1px solid rgba(148,163,184,.12)",
                background: "rgba(15,23,42,.5)",
                padding: 16,
                color: "#94a3b8",
                fontSize: 13,
                lineHeight: 1.7,
              }}
            >
              Tip: en Supabase configura <b style={{ color: "#e2e8f0" }}>Site URL</b> y agrega
              <b style={{ color: "#e2e8f0" }}> /auth/callback</b> como redirect URL.
            </div>
          </section>
        </div>

        <section
          style={{
            marginTop: 22,
            padding: 22,
            borderRadius: 28,
            border: "1px solid rgba(148,163,184,.14)",
            background: "rgba(2,6,23,.48)",
            boxShadow: "0 24px 64px rgba(2,6,23,.24)",
            backdropFilter: "blur(16px)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              alignItems: "end",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div style={{ fontSize: 13, color: "#94a3b8", fontWeight: 700 }}>Módulos activos</div>
              <h2 style={{ margin: "8px 0 0", fontSize: 22, fontWeight: 900, color: "#f8fafc" }}>
                Todo el ecosistema en una sola capa
              </h2>
            </div>
            <Link
              href="/dashboard"
              style={{
                color: "#7dd3fc",
                textDecoration: "none",
                fontWeight: 800,
              }}
            >
              Abrir panel →
            </Link>
          </div>

          <div
            style={{
              marginTop: 18,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 14,
            }}
          >
            {modules.map((m) => (
              <div
                key={m.title}
                style={{
                  borderRadius: 20,
                  border: "1px solid rgba(148,163,184,.14)",
                  background: "rgba(15,23,42,.52)",
                  padding: 18,
                }}
              >
                <div style={{ fontWeight: 900, color: "#f8fafc", fontSize: 15 }}>{m.title}</div>
                <div style={{ marginTop: 8, fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>
                  {m.desc}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}