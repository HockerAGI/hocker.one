import AppNav from "@/components/AppNav";
import CommandsQueue from "@/components/CommandsQueue";

export default function CommandsPage() {
  return (
    <main style={{ maxWidth: 1100, margin: "28px auto", padding: 16 }}>
      <header style={{ display: "grid", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Commands</h1>
        <AppNav />
        <div style={{ opacity: 0.75 }}>Aquí apruebas comandos “needs_approval” y monitoreas la cola.</div>
      </header>

      <section style={{ marginTop: 16 }}>
        <CommandsQueue />
      </section>
    </main>
  );
}