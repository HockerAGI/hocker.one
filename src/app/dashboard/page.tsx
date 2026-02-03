import AppNav from "@/components/AppNav";
import NodeBadge from "@/components/NodeBadge";
import CommandBox from "@/components/CommandBox";
import EventsFeed from "@/components/EventsFeed";

export default function DashboardPage() {
  return (
    <main style={{ maxWidth: 1100, margin: "28px auto", padding: 16 }}>
      <header style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h1 style={{ marginBottom: 6 }}>Dashboard</h1>
            <div style={{ opacity: 0.75 }}>Centro de mando: Commands firmados + Events + Auditoría.</div>
          </div>
          <form action="/signout" method="post">
            <button type="submit" style={{ padding: "12px 14px", cursor: "pointer", borderRadius: 12, border: "1px solid #d6e3ff", background: "#fff" }}>
              Cerrar sesión
            </button>
          </form>
        </div>

        <AppNav />
        <NodeBadge />
      </header>

      <section style={{ marginTop: 16, display: "grid", gap: 16 }}>
        <CommandBox />
        <EventsFeed />
      </section>
    </main>
  );
}