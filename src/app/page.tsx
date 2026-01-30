import AuthBox from "@/components/AuthBox";

export default function HomePage() {
  return (
    <main style={{ maxWidth: 920, margin: "40px auto", padding: 16 }}>
      <h1 style={{ marginBottom: 8 }}>HOCKER ONE</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        Panel maestro (antes Control H). Login para operar nodos, comandos y eventos.
      </p>

      <div style={{ marginTop: 24 }}>
        <AuthBox />
      </div>

      <div style={{ marginTop: 28, fontSize: 13, opacity: 0.7 }}>
        <p style={{ margin: 0 }}>
          Nota: Las credenciales se configuran en <code>.env</code> (no se suben a GitHub).
        </p>
      </div>
    </main>
  );
}