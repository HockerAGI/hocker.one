import NodeBadge from "@/components/NodeBadge";
import CommandBox from "@/components/CommandBox";
import EventsFeed from "@/components/EventsFeed";

export default function DashboardPage() {
  return (
    <main style={{ maxWidth: 1100, margin: "28px auto", padding: 16 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <h1 style={{ marginBottom: 6 }}>Dashboard</h1>
          <div style={{ opacity: 0.75 }}>Centro de mando: comandos → nodos / eventos → panel.</div>
        </div>
        <form action="/signout" method="post">
          <button type="submit" style={{ padding: "10px 14px", cursor: "pointer" }}>
            Cerrar sesión
          </button>
        </form>
      </header>

      <section style={{ marginTop: 18 }}>
        <NodeBadge />
      </section>

      <section style={{ marginTop: 18, display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
        <CommandBox />
        <EventsFeed />
      </section>
    </main>
  );
}