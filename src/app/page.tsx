import AuthBox from "@/components/AuthBox";

export default function HomePage() {
  return (
    <main style={{ maxWidth: 920, margin: "40px auto", padding: 16 }}>
      <h1 style={{ marginBottom: 8 }}>HOCKER ONE</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        Panel maestro del ecosistema HOCKER. Login para operar nodos, comandos y eventos.
      </p>
      <div style={{ marginTop: 24 }}>
        <AuthBox />
      </div>
    </main>
  );
}