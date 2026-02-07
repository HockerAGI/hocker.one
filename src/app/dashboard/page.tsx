import AuthBox from "@/components/AuthBox";
import NovaChat from "@/components/NovaChat";
import CommandBox from "@/components/CommandBox";
import CommandsQueue from "@/components/CommandsQueue";
import EventsFeed from "@/components/EventsFeed";
import NodesPanel from "@/components/NodesPanel";

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-slate-600">
          Hablas con NOVA, NOVA decide y el sistema ejecuta. Todo queda registrado.
        </p>
      </header>

      <section className="mt-6">
        <AuthBox />
      </section>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <NovaChat />
        <div className="space-y-6">
          <CommandBox />
          <NodesPanel />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CommandsQueue />
        <EventsFeed />
      </div>
    </main>
  );
}