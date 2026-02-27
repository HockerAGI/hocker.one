"use client";

import PageShell from "@/components/PageShell";
import GovernancePanel from "@/components/GovernancePanel";
import EventsFeed from "@/components/EventsFeed";

export default function GovernancePage() {
  return (
    <PageShell
      title="Seguridad"
      subtitle="Control de emergencia y permisos. Esto manda sobre TODO el sistema."
    >
      <div className="grid grid-cols-1 gap-6">
        <GovernancePanel />

        <div className="hocker-card p-5">
          <div className="text-lg font-bold">¿Qué hace cada switch?</div>
          <div className="mt-2 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="font-semibold text-slate-900">Kill Switch</div>
              <div className="mt-1">Bloquea ejecución. Ideal si detectas algo raro o quieres pausar operaciones.</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="font-semibold text-slate-900">Modo de escritura</div>
              <div className="mt-1">Permite que el sistema cree acciones y haga cambios. Si está apagado, todo queda en modo lectura.</div>
            </div>
          </div>
        </div>

        <EventsFeed />
      </div>
    </PageShell>
  );
}
