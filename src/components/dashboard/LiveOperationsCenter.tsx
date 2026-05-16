import type { DashboardSummary } from "@/lib/hocker-dashboard";
import { getStatusLabel } from "@/lib/hocker-dashboard";
import StatusBadge from "@/components/ui-hocker/StatusBadge";

function formatDate(input: string) {
  const date = new Date(input);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("es-MX");
}

export default function LiveOperationsCenter({ summary }: { summary: DashboardSummary }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="rounded-[30px] border border-white/8 bg-white/[0.035] p-5">
        <h3 className="text-lg font-black text-white">Eventos recientes</h3>
        <p className="mt-2 text-sm text-slate-400">Actividad real registrada por el sistema.</p>
        <div className="mt-4 space-y-3">
          {summary.recentEvents.length === 0 ? <p className="text-sm text-slate-500">Sin eventos recientes.</p> : summary.recentEvents.map((event) => (
            <details key={event.id} className="rounded-2xl border border-white/8 bg-slate-950/45 p-4">
              <summary className="cursor-pointer list-none text-sm font-black text-white">{event.title}</summary>
              <p className="mt-2 text-sm text-slate-400">{event.detail}</p>
              <p className="mt-2 text-xs text-slate-500">{formatDate(event.at)}</p>
            </details>
          ))}
        </div>
      </section>
      <section className="rounded-[30px] border border-white/8 bg-white/[0.035] p-5">
        <h3 className="text-lg font-black text-white">Tareas recientes</h3>
        <p className="mt-2 text-sm text-slate-400">Pendientes, en curso o cerradas.</p>
        <div className="mt-4 space-y-3">
          {summary.recentCommands.length === 0 ? <p className="text-sm text-slate-500">Sin tareas recientes.</p> : summary.recentCommands.map((cmd) => (
            <details key={cmd.id} className="rounded-2xl border border-white/8 bg-slate-950/45 p-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-black text-white">
                <span>{cmd.command}</span>
                <StatusBadge status={cmd.status} compact />
              </summary>
              <p className="mt-2 text-sm text-slate-400">Estado: {getStatusLabel(cmd.status)}</p>
              <p className="mt-2 text-xs text-slate-500">Proyecto: {cmd.projectId} · {formatDate(cmd.createdAt)}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
