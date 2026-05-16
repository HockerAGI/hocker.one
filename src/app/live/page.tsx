import Link from "next/link";
import { requirePrivateSession } from "@/lib/require-private-session";
import { getHockerLiveSummary } from "@/lib/hocker-live-summary";
import { getHockerNodeMirrorSummary } from "@/lib/hocker-node-mirror-summary";
import PhysicalAgentPanel from "@/components/live/PhysicalAgentPanel";
import NodeMirrorPanel from "@/components/live/NodeMirrorPanel";

export const dynamic = "force-dynamic";

function formatDate(value: string | null) {
  if (!value) return "Sin fecha";

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function badgeClass(tone: "active" | "protected" | "pending" | "blocked" | "neutral") {
  const base = "inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em]";

  if (tone === "active") return `${base} border-emerald-300/30 bg-emerald-400/10 text-emerald-100`;
  if (tone === "protected") return `${base} border-sky-300/30 bg-sky-400/10 text-sky-100`;
  if (tone === "pending") return `${base} border-amber-300/30 bg-amber-400/10 text-amber-100`;
  if (tone === "blocked") return `${base} border-rose-300/30 bg-rose-400/10 text-rose-100`;

  return `${base} border-white/10 bg-white/[0.04] text-slate-300`;
}

function commandTone(status: string | null) {
  if (status === "done") return "active";
  if (status === "error") return "blocked";
  if (status === "pending") return "pending";
  return "neutral";
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[32px] border border-white/10 bg-white/[0.035] p-5 shadow-[0_22px_90px_rgba(0,0,0,0.28)]">
      <div className="mb-4">
        <h2 className="text-xl font-black tracking-[-0.03em] text-white">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-400">{description}</p>
      </div>
      {children}
    </section>
  );
}

export default async function LivePage() {
  await requirePrivateSession();
  const summary = await getHockerLiveSummary();
  const nodeMirror = await getHockerNodeMirrorSummary();

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
    <main className="space-y-5 pb-28">
      <section className="rounded-[34px] border border-cyan-300/15 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_34%),rgba(255,255,255,0.035)] p-5 shadow-[0_30px_120px_rgba(0,0,0,0.35)]">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200">Live Data</p>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.06em] text-white sm:text-5xl">
          Estado real del ecosistema
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
          Datos leídos desde Supabase y producción. Sin tokens, sin llaves y sin payloads sensibles.
        </p>
        <p className="mt-4 text-xs text-slate-500">Actualizado: {formatDate(summary.generated_at)}</p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Producción</p>
          <h2 className="mt-2 text-lg font-black text-white">Hocker ONE</h2>
          <p className="mt-1 text-sm text-slate-400">{summary.production.domain}</p>
          <div className="mt-4"><span className={badgeClass("active")}>Lista</span></div>
        </article>

        <article className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Seguridad</p>
          <h2 className="mt-2 text-lg font-black text-white">Rutas privadas</h2>
          <p className="mt-1 text-sm text-slate-400">Protegidas por sesión privada.</p>
          <div className="mt-4"><span className={badgeClass("protected")}>Protegidas</span></div>
        </article>

        <article className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Ejecución real</p>
          <h2 className="mt-2 text-lg font-black text-white">Bloqueada</h2>
          <p className="mt-1 text-sm text-slate-400">No hay acciones sensibles abiertas.</p>
          <div className="mt-4"><span className={badgeClass("blocked")}>Execution Lock</span></div>
        </article>

        <article className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Chido</p>
          <h2 className="mt-2 text-lg font-black text-white">Read-only</h2>
          <p className="mt-1 text-sm text-slate-400">Monitoreo y preflight bloqueado.</p>
          <div className="mt-4"><span className={badgeClass("protected")}>Protegido</span></div>
        </article>
      </section>



      <PhysicalAgentPanel agent={summary.agent} />

      <NodeMirrorPanel bridge={nodeMirror} />

      <Section title="Conteos reales" description="Lectura directa de tablas existentes. Si está en cero, aún no hay registros reales.">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {visibleCounts.map((item) => (
            <article key={item.table} className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{item.table}</p>
              <div className="mt-3 flex items-center justify-between gap-3">
                <h3 className="text-base font-black text-white">{item.label}</h3>
                <span className="text-2xl font-black text-cyan-100">{item.count ?? "—"}</span>
              </div>
              {!item.ok ? <p className="mt-2 text-xs text-amber-200">{item.note}</p> : null}
            </article>
          ))}
        </div>
      </Section>

      <Section title="Owner y proyectos" description="Roles actuales detectados en project_members.">
        <div className="space-y-3">
          {summary.owner_memberships.map((item) => (
            <article key={`${item.project_id}-${item.user_id}`} className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-black text-white">{item.project_id}</h3>
                  <p className="mt-1 text-xs text-slate-500">Asignado: {formatDate(item.created_at)}</p>
                </div>
                <span className={badgeClass(item.role === "owner" ? "active" : "neutral")}>{item.role}</span>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section title="Últimos eventos" description="Historial reciente del ecosistema. Se muestran mensajes resumidos.">
        <div className="space-y-3">
          {summary.recent_events.map((event) => (
            <article key={event.id} className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{event.type || "evento"}</p>
                  <h3 className="mt-1 text-sm font-bold leading-6 text-white">{event.message || "Sin mensaje"}</h3>
                  <p className="mt-2 text-xs text-slate-500">{formatDate(event.created_at)}</p>
                </div>
                <span className={badgeClass(event.level === "error" ? "blocked" : event.level === "warn" ? "pending" : "neutral")}>
                  {event.level || "info"}
                </span>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section title="Últimos comandos" description="Muestra el estado histórico de comandos. Los errores viejos no significan fallo actual.">
        <div className="space-y-3">
          {summary.recent_commands.map((cmd) => (
            <article key={cmd.id} className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">{cmd.node_id || "nodo"}</p>
                  <h3 className="mt-1 text-sm font-black text-white">{cmd.command || "Comando"}</h3>
                  <p className="mt-2 text-xs text-slate-500">{formatDate(cmd.created_at)}</p>
                  {cmd.error ? <p className="mt-2 text-xs text-amber-200">Error registrado: {cmd.error}</p> : null}
                </div>
                <span className={badgeClass(commandTone(cmd.status))}>{cmd.status || "sin estado"}</span>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section title="Lectura ejecutiva" description="Interpretación segura de los datos actuales.">
        <ul className="space-y-2">
          {summary.findings.map((finding) => (
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
