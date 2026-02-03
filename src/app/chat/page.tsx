import AppNav from "@/components/AppNav";
import NovaChat from "@/components/NovaChat";

export default function ChatPage() {
  return (
    <main style={{ maxWidth: 1100, margin: "28px auto", padding: 16 }}>
      <header style={{ display: "grid", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Chat NOVA</h1>
        <AppNav />
        <div style={{ opacity: 0.75 }}>Texto/Voz → NOVA (Cloud) → acciones cloud + comandos al nodo físico.</div>
      </header>

      <section style={{ marginTop: 16 }}>
        <NovaChat />
      </section>
    </main>
  );
}