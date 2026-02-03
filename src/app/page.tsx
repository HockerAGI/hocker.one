import AuthBox from "@/components/AuthBox";

export default function HomePage() {
  return (
    <main style={{ maxWidth: 980, margin: "40px auto", padding: 16 }}>
      <div style={{ background: "#fff", border: "1px solid #e6eefc", borderRadius: 16, padding: 18 }}>
        <h1 style={{ margin: 0 }}>HOCKER ONE</h1>
        <p style={{ marginTop: 8, opacity: 0.8 }}>
          Control Plane del ecosistema. Login → comandos firmados → auditoría → ejecución cloud/local.
        </p>
      </div>

      <div style={{ marginTop: 16 }}>
        <AuthBox />
      </div>

      <div style={{ marginTop: 14, fontSize: 13, opacity: 0.75 }}>
        Recomendación: deja el signup apagado y crea usuarios por invitación.
      </div>
    </main>
  );
}