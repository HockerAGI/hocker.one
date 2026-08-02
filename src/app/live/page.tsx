import Link from "next/link";
import { requirePrivateSession } from "@/lib/require-private-session";
import { getHockerLiveSummary } from "@/lib/hocker-live-summary";
import { getHockerNodeMirrorSummary } from "@/lib/hocker-node-mirror-summary";
import { getHockerMemoryMirrorLiveSummary } from "@/lib/hocker-memory-mirror-live-summary";
import { getHockerOperationalSnapshot, type OperationalStatus } from "@/lib/hocker-operational-state";
import PhysicalAgentPanel from "@/components/live/PhysicalAgentPanel";
import NodeMirrorPanel from "@/components/live/NodeMirrorPanel";
import MemoryMirrorPanel from "@/components/live/MemoryMirrorPanel";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatDate(value?: string | null) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Tijuana",
  }).format(new Date(value));
}

function badgeClass(status: OperationalStatus) {
  const base = "inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em]";
  if (status === "online") return `${base} border-emerald-300/30 bg-emerald-400/10 text-emerald-100`;
  if (status === "configured") return `${base} border-cyan-300/30 bg-cyan-400/10 text-cyan-100`;
  if (status === "stale" || status === "unknown") return `${base} border-amber-300/30 bg-amber-400/10 text-amber-100`;
  if (status === "offline" || status === "degraded") return `${base} border-rose-300/30 bg-rose-400/10 text-rose-100`;
  return `${base} border-white/10 bg-white/[0.04] text-slate-300`;
}

function statusLabel(status: OperationalStatus) {
  if (status === "online") return "Verificado";
  if (status === "configured") return "Configurado";
  if (status === "stale") return "Sin señal reciente";
  if (status === "offline") return "Sin conexión";
  if (status === "degraded") return "Degradado";
  return "Sin verificar";
}

function StatusCard({ label, title, text, status }: { label: string; title: string; text: string; status: OperationalStatus }) {
  return (
    <article className="rounded-[22px] border border-white/10 bg-white/[0.04] p-3.5">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <h2 className="mt-1.5 text-base font-black text-white">{title}</h2>
      <p className="mt-1 text-xs leading-5 text-slate-400">{text}</p>
      <div className="mt-3"><span className={badgeClass(status)}>{statusLabel(status)}</span></div>
    </article>
  );
}

function Metric({ label, value, text }: { label: string; value: string | number; text: string }) {
  return (
    <article className="rounded-[22px] border border-white/10 bg-slate-950/35 p-3.5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
        <strong className="text-2xl font-black tracking-[-0.05em] text-cyan-100">{value}</strong>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-400">{text}</p>
    </article>
  );
}

function Section({ title, description, defaultOpen = false, children }: { title: string; description: string; defaultOpen?: boolean; children: React.ReactNode }) {
  return (
    <details open={defaultOpen} className="group rounded-[26px] border border-white/10 bg-white/[0.032] p-4 shadow-[0_18px_70px_rgba(0,0,0,0.20)]">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-black tracking-[-0.03em] text-white">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-300">Abrir</span>
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

export default async function LivePage() {
  await requirePrivateSession();
  const [summary, nodeMirror, memoryMirror, operational] = await Promise.all([
    getHockerLiveSummary(),
    getHockerNodeMirrorSummary(),
    getHockerMemoryMirrorLiveSummary(),
    getHockerOperationalSnapshot(),
  ]);

  const nova = operational.runtime.service_status.nova;
  const supabase = operational.runtime.service_status.supabase;
  const agentStatus: OperationalStatus = summary.agent.state === "activo"
    ? "online"
    : summary.agent.state === "sin_senal_reciente"
      ? "stale"
      : "offline";

  return (
    <main className="hko-page-flow space-y-4">
      <section className="rounded-[28px] border border-cyan-300/15 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_34%),rgba(255,255,255,0.035)] p-4 shadow-[0_24px_90px_rgba(0,0,0,0.32)]">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">Estado operativo</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] text-white sm:text-5xl">Señales verificables</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
          Solo se muestra como activo aquello que tiene health check, consulta o señal reciente.
        </p>
        <p className="mt-3 text-xs text-slate-500">Actualizado: {formatDate(operational.checked_at)}</p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatusCard label="Panel" title="Hocker ONE" text="Esta instancia respondió la solicitud actual." status="online" />
        <StatusCard label="Orquestador" title="NOVA" text={nova.detail} status={nova.status} />
        <StatusCard label="Datos" title="Supabase" text={supabase.detail} status={supabase.status} />
        <StatusCard label="Nodo físico" title={summary.agent.node_id} text={`Última señal: ${formatDate(summary.agent.last_seen_at)}`} status={agentStatus} />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Servicios verificados" value={operational.metrics.verified_services} text="Health checks o consultas reales." />
        <Metric label="Nodos con señal" value={operational.metrics.fresh_nodes} text="Últimos cinco minutos." />
        <Metric label="Runs en 24 h" value={operational.metrics.runs_24h} text="Ejecuciones realmente registradas." />
        <Metric label="Por aprobar" value={operational.metrics.pending_actions} text="Acciones bloqueantes en Owner Gate." />
      </section>

      <Section title="Agente físico" description="Estado del nodo local y controles detectados." defaultOpen>
        <PhysicalAgentPanel agent={summary.agent} />
      </Section>

      <Section title="Nodo espejo y memoria" description="Registros persistidos; no se presentan como actividad actual sin fecha reciente.">
        <div className="grid gap-4 xl:grid-cols-2">
          <NodeMirrorPanel bridge={nodeMirror} />
          <MemoryMirrorPanel summary={memoryMirror} />
        </div>
      </Section>

      <Section title="Eventos y comandos" description="Historial reciente disponible en Supabase.">
        <div className="grid gap-4 xl:grid-cols-2">
          <div className="space-y-3">
            <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-400">Eventos</h3>
            {summary.recent_events.slice(0, 8).map((event) => (
              <article key={event.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <p className="text-sm font-bold text-white">{event.message ?? event.type ?? "Evento"}</p>
                <p className="mt-2 text-xs text-slate-500">{formatDate(event.created_at)} · {event.level ?? "info"}</p>
              </article>
            ))}
            {summary.recent_events.length === 0 ? <p className="text-sm text-slate-500">Sin eventos registrados.</p> : null}
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-400">Comandos</h3>
            {summary.recent_commands.slice(0, 8).map((command) => (
              <article key={command.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <p className="text-sm font-bold text-white">{command.command ?? "Comando"}</p>
                <p className="mt-2 text-xs text-slate-500">{formatDate(command.created_at)} · {command.status ?? "sin estado"}</p>
              </article>
            ))}
            {summary.recent_commands.length === 0 ? <p className="text-sm text-slate-500">Sin comandos registrados.</p> : null}
          </div>
        </div>
      </Section>

      <div className="flex flex-wrap gap-2">
        <Link href="/nodes" className="hocker-button-secondary">Ver nodos</Link>
        <Link href="/commands" className="hocker-button-primary">Revisar aprobaciones</Link>
      </div>
    </main>
  );
}
