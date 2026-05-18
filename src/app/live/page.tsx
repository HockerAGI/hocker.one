import Link from "next/link";
import { requirePrivateSession } from "@/lib/require-private-session";
import { getHockerLiveSummary } from "@/lib/hocker-live-summary";
import { getHockerNodeMirrorSummary } from "@/lib/hocker-node-mirror-summary";
import { getHockerMemoryMirrorLiveSummary } from "@/lib/hocker-memory-mirror-live-summary";
import { humanCommandLabel, humanEventLabel, humanLabel, humanStatusLabel } from "@/lib/hocker-human-labels";
import PhysicalAgentPanel from "@/components/live/PhysicalAgentPanel";
import NodeMirrorPanel from "@/components/live/NodeMirrorPanel";
import MemoryMirrorPanel from "@/components/live/MemoryMirrorPanel";

export const dynamic = "force-dynamic";

function formatDate(value?: string | null) {
  if (!value) return "Sin fecha";

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function badgeClass(tone: "active" | "protected" | "pending" | "blocked" | "neutral") {
  const base = "inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em]";

  if (tone === "active") return `${base} border-emerald-300/30 bg-emerald-400/10 text-emerald-100`;
  if (tone === "protected") return `${base} border-sky-300/30 bg-sky-400/10 text-sky-100`;
  if (tone === "pending") return `${base} border-amber-300/30 bg-amber-400/10 text-amber-100`;
  if (tone === "blocked") return `${base} border-rose-300/30 bg-rose-400/10 text-rose-100`;

  return `${base} border-white/10 bg-white/[0.04] text-slate-300`;
}

function commandTone(status?: string | null) {
  if (status === "done") return "active";
  if (status === "error") return "blocked";
  if (status === "pending" || status === "queued" || status === "needs_approval") return "pending";
  if (status === "running") return "protected";
  return "neutral";
}

function levelTone(level?: string | null) {
  if (level === "error") return "blocked";
  if (level === "warn") return "pending";
  return "neutral";
}

function StatusCard({
  label,
  title,
  text,
  tone,
  badge,
}: {
  label: string;
  title: string;
  text: string;
  tone: "active" | "protected" | "pending" | "blocked" | "neutral";
  badge: string;
}) {
  return (
    <article className="rounded-[22px] border border-white/10 bg-white/[0.04] p-3.5">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <h2 className="mt-1.5 text-base font-black text-white">{title}</h2>
      <p className="mt-1 text-xs leading-5 text-slate-400">{text}</p>
      <div className="mt-3"><span className={badgeClass(tone)}>{badge}</span></div>
    </article>
  );
}

function Metric({
  label,
  value,
  text,
}: {
  label: string;
  value: string | number;
  text: string;
}) {
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

function Section({
  title,
  description,
  defaultOpen = false,
  children,
}: {
  title: string;
  description: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details open={defaultOpen} className="group rounded-[26px] border border-white/10 bg-white/[0.032] p-4 shadow-[0_18px_70px_rgba(0,0,0,0.20)]">
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-black tracking-[-0.03em] text-white">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-slate-300">
          Abrir
        </span>
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

export default async function LivePage() {
  await requirePrivateSession();
  const summary = await getHockerLiveSummary();
  const nodeMirror = await getHockerNodeMirrorSummary();
  const memoryMirror = await getHockerMemoryMirrorLiveSummary();

  const visibleCounts = summary.counts.filter((item) =>
    [
      "projects",
      "project_members",
      "commands",
      "events",
      "audit_logs",
      "agis",
      "nodes",
      "hocker_tenants",
      "hocker_portal_grants",
    ].includes(item.table),
  );

  return (
    <main className="hko-page-flow space-y-4">
      <section className="rounded-[28px] border border-cyan-300/15 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_34%),rgba(255,255,255,0.035)] p-4 shadow-[0_24px_90px_rgba(0,0,0,0.32)]">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">Sistema en vivo</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] text-white sm:text-5xl">Señales reales</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
          Sin llaves, sin secretos y sin datos inventados.
        </p>
        <p className="mt-3 text-xs text-slate-500">Actualizado: {formatDate(summary.generated_at)}</p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatusCard label="Producción" title="Hocker ONE" text={summary.production.domain} tone="active" badge="Lista" />
        <StatusCard label="Seguridad" title="Rutas privadas" text="Protegidas por sesión privada." tone="protected" badge="Protegidas" />
        <StatusCard label="Ejecución" title="Bloqueada" text="No hay acciones sensibles abiertas." tone="blocked" badge="Bloqueada" />
        <StatusCard label="Chido" title="Solo lectura" text="Monitoreo y revisión previa bloqueada." tone="protected" badge="Seguro" />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Memoria IA" value={memoryMirror.approved_memory_count} text="Memorias aprobadas." />
        <Metric label="AGIs actualizadas" value={memoryMirror.active_feed_count} text="Actualizaciones activas." />
        <Metric label="Errores prevenidos" value={memoryMirror.prevented_error_count} text="Reglas para no repetir fallos." />
        <Metric label="Repetidos sin duplicar" value={memoryMirror.dedup_hits} text="Datos detectados sin inflar memoria." />
      </section>

      <Section title="Agente físico" description="Estado del nodo local y modo seguro." defaultOpen>
        <PhysicalAgentPanel agent={summary.agent} />
      </Section>

      <Section title="Nodo espejo y memoria" description="Detalles completos bajo demanda.">
        <div className="grid gap-4 xl:grid-cols-2">
          <NodeMirrorPanel bridge={nodeMirror} />
          <MemoryMirrorPanel summary={memoryMirror} />
        </div>
      </Section>

      <Section title="Números reales" description="Lectura directa del sistema. Si aparece en cero, todavía no hay datos reales.">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visibleCounts.map((item) => (
            <article key={item.table} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">{humanLabel(item.table)}</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-black text-white">{item.label}</h3>
                <span className="text-2xl font-black text-cyan-100">{item.count ?? "—"}</span>
              </div>
              {!item.ok ? <p className="mt-2 text-xs text-amber-200">{item.note}</p> : null}
            </article>
          ))}
        </div>
      </Section>

      <Section title="Owner y proyectos" description="Roles actuales detectados en miembros del proyecto.">
        <div className="space-y-3">
          {summary.owner_memberships.map((item) => (
            <article key={`${item.project_id}-${item.user_id}`} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-black text-white">{item.project_id}</h3>
                  <p className="mt-1 text-xs text-slate-500">Asignado: {formatDate(item.created_at)}</p>
                </div>
                <span className={badgeClass(item.role === "owner" ? "active" : "neutral")}>{humanLabel(item.role)}</span>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section title="Últimos eventos" description="Historial reciente del ecosistema en lenguaje claro.">
        <div className="space-y-3">
          {summary.recent_events.slice(0, 6).map((event) => (
            <article key={event.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{humanEventLabel(event.type)}</p>
                  <h3 className="mt-1 text-sm font-bold leading-6 text-white">{event.message || "Sin mensaje"}</h3>
                  <p className="mt-2 text-xs text-slate-500">{formatDate(event.created_at)}</p>
                </div>
                <span className={badgeClass(levelTone(event.level))}>{humanStatusLabel(event.level || "info")}</span>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section title="Últimas tareas" description="Errores antiguos se muestran como historial, no como fallo actual.">
        <div className="space-y-3">
          {summary.recent_commands.slice(0, 6).map((cmd) => (
            <article key={cmd.id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{cmd.node_id || "nodo"}</p>
                  <h3 className="mt-1 text-sm font-black text-white">{humanCommandLabel(cmd.command)}</h3>
                  <p className="mt-2 text-xs text-slate-500">{formatDate(cmd.created_at)}</p>
                  {cmd.error ? <p className="mt-2 text-xs text-amber-200">Error histórico: {cmd.error}</p> : null}
                </div>
                <span className={badgeClass(commandTone(cmd.status))}>{humanStatusLabel(cmd.status || "sin estado")}</span>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section title="Lectura clara" description="Interpretación segura de los datos actuales.">
        <ul className="space-y-2">
          {summary.findings.slice(0, 5).map((finding) => (
            <li key={finding} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
              {finding}
            </li>
          ))}
        </ul>
      </Section>

      <div className="flex flex-wrap gap-3">
        <Link href="/status" className="hocker-button-secondary">Ver estado</Link>
        <Link href="/commands" className="hocker-button-secondary">Ver tareas</Link>
        <Link href="/security" className="hocker-button-secondary">Ver seguridad</Link>
      </div>
    </main>
  );
}
