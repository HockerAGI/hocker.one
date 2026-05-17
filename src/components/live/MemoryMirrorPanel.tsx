import type {
  HockerMemoryMirrorErrorPattern,
  HockerMemoryMirrorFeedGroup,
  HockerMemoryMirrorFeedItem,
  HockerMemoryMirrorLearningItem,
  HockerMemoryMirrorLiveSummary,
  HockerMemoryMirrorMemoryItem,
} from "@/lib/hocker-memory-mirror-live-summary";

type BadgeTone = "active" | "protected" | "pending" | "blocked" | "neutral";

function formatDate(value: string | null) {
  if (!value) return "Sin señal";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sin señal";

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function badgeClass(tone: BadgeTone) {
  const base = "inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em]";

  if (tone === "active") return `${base} border-emerald-300/30 bg-emerald-400/10 text-emerald-100`;
  if (tone === "protected") return `${base} border-sky-300/30 bg-sky-400/10 text-sky-100`;
  if (tone === "pending") return `${base} border-amber-300/30 bg-amber-400/10 text-amber-100`;
  if (tone === "blocked") return `${base} border-rose-300/30 bg-rose-400/10 text-rose-100`;

  return `${base} border-white/10 bg-white/[0.04] text-slate-300`;
}

function statusTone(value: string | null): BadgeTone {
  if (value === "active" || value === "approved" || value === "safe") return "active";
  if (value === "pending_review" || value === "review_required") return "pending";
  if (value === "blocked" || value === "rejected" || value === "critical") return "blocked";
  return "neutral";
}

function numberLabel(value: number | null | undefined) {
  if (value === null || value === undefined) return "0";
  return new Intl.NumberFormat("es-MX").format(value);
}

function agiLabel(value: string) {
  const map: Record<string, string> = {
    candy: "Candy Ads",
    nova_ads: "Nova Ads",
    pro_ia: "PRO IA",
    syntia: "Syntia",
    nova: "NOVA",
    vertx: "Vertx",
    jurix: "Jurix",
    numia: "Numia",
    revia: "REVIA",
    curvewind: "Curvewind",
    hostia: "Hostia",
    trackhok: "Trackhok",
    nexpa: "NEXPA",
    chido_wins: "Chido Wins",
    chido_gerente: "Chido Gerente",
    shadows: "Shadows IA",
  };

  return map[value] || value;
}

function MetricCard({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: BadgeTone }) {
  return (
    <article className="rounded-[26px] border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-2xl font-black tracking-[-0.04em] text-white">{value}</h3>
        <span className={badgeClass(tone)}>{tone === "active" ? "Real" : tone === "pending" ? "Pendiente" : tone === "protected" ? "Seguro" : "Info"}</span>
      </div>
      <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
    </article>
  );
}

function MemoryRow({ item }: { item: HockerMemoryMirrorMemoryItem }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-black/15 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-cyan-200">
            {agiLabel(item.source_agi_id || "agi")} → {item.target_agi_ids.map(agiLabel).join(" / ") || "AGIs destino"}
          </p>
          <h3 className="mt-2 text-sm font-black leading-6 text-white">{item.title}</h3>
          <p className="mt-2 text-xs text-slate-500">Última señal: {formatDate(item.last_seen_at || item.created_at)}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={badgeClass(item.active ? "active" : "neutral")}>{item.active ? "Activa" : "Inactiva"}</span>
          {item.prevents_error ? <span className={badgeClass("protected")}>Previene error</span> : null}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold text-slate-400">
        <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1">Veces vista: {numberLabel(item.times_seen)}</span>
        <span className="rounded-full border border-white/10 bg-white/[0.035] px-3 py-1">Retención: {item.retention_tier || "hot"}</span>
      </div>
    </article>
  );
}

function FeedPill({ item }: { item: HockerMemoryMirrorFeedGroup }) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Feed activo</p>
          <h3 className="mt-1 text-base font-black text-white">{agiLabel(item.agi_id)}</h3>
        </div>
        <span className={badgeClass("active")}>{numberLabel(item.count)}</span>
      </div>
      <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-400">{item.latest_title}</p>
      <p className="mt-2 text-[11px] text-slate-600">Última señal: {formatDate(item.last_seen_at)}</p>
    </article>
  );
}

function FeedRow({ item }: { item: HockerMemoryMirrorFeedItem }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">{agiLabel(item.agi_id)} · {item.update_type || "update"}</p>
          <h3 className="mt-1 text-sm font-bold leading-6 text-white">{item.title}</h3>
          <p className="mt-1 text-xs text-slate-500">Visto {numberLabel(item.times_seen)} veces · {formatDate(item.last_seen_at || item.created_at)}</p>
        </div>
        <span className={badgeClass(statusTone(item.status))}>{item.status || "activo"}</span>
      </div>
    </article>
  );
}

function PendingRow({ item }: { item: HockerMemoryMirrorLearningItem }) {
  return (
    <article className="rounded-2xl border border-amber-300/15 bg-amber-400/[0.04] px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-amber-200">{agiLabel(item.source_agi_id || "agi")} · {item.update_type || "learning"}</p>
          <h3 className="mt-1 text-sm font-bold leading-6 text-white">{item.learning_title}</h3>
          <p className="mt-1 text-xs text-slate-500">Registrado: {formatDate(item.created_at)}</p>
        </div>
        <span className={badgeClass("pending")}>{item.status || "pendiente"}</span>
      </div>
    </article>
  );
}

function ErrorRow({ item }: { item: HockerMemoryMirrorErrorPattern }) {
  return (
    <article className="rounded-2xl border border-emerald-300/10 bg-emerald-400/[0.035] px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-200">Error prevenido</p>
          <h3 className="mt-1 text-sm font-bold leading-6 text-white">{item.error_title}</h3>
          <p className="mt-1 text-xs text-slate-500">Detectado {numberLabel(item.times_seen)} veces · {formatDate(item.last_seen_at || item.created_at)}</p>
        </div>
        <span className={badgeClass(statusTone(item.severity))}>{item.severity || "medio"}</span>
      </div>
    </article>
  );
}

export default function MemoryMirrorPanel({ summary }: { summary: HockerMemoryMirrorLiveSummary }) {
  return (
    <section className="rounded-[34px] border border-teal-300/15 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.14),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.08),transparent_30%),rgba(255,255,255,0.035)] p-5 shadow-[0_24px_95px_rgba(0,0,0,0.30)]">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-200">Memoria Espejo IA↔IA</p>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">Aprendizaje vivo del ecosistema</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Conocimiento aprobado, feeds por AGI y errores prevenidos. Solo muestra señales limpias; no expone payloads ni secretos.
          </p>
        </div>
        <span className={badgeClass(summary.approved_memory_count > 0 ? "active" : "pending")}>{summary.approved_memory_count > 0 ? "Operando" : "Sin memoria"}</span>
      </div>

      <div className="mb-5 rounded-3xl border border-white/10 bg-black/20 p-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Flujo real</p>
        <p className="mt-2 text-base font-black tracking-[-0.02em] text-white">{summary.flow_label}</p>
        <p className="mt-2 text-xs text-slate-500">Última sincronización: {formatDate(summary.last_sync_at || summary.generated_at)}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Memorias" value={numberLabel(summary.approved_memory_count)} detail="Conocimiento aprobado y reutilizable." tone={summary.approved_memory_count > 0 ? "active" : "pending"} />
        <MetricCard label="Feeds AGI" value={numberLabel(summary.active_feed_count)} detail="Actualizaciones entregadas por función." tone={summary.active_feed_count > 0 ? "active" : "pending"} />
        <MetricCard label="Errores" value={numberLabel(summary.prevented_error_count)} detail="Patrones registrados para no repetir fallos." tone={summary.prevented_error_count > 0 ? "protected" : "neutral"} />
        <MetricCard label="Dedup" value={numberLabel(summary.dedup_hits)} detail="Repeticiones detectadas sin duplicar datos." tone={summary.dedup_hits > 0 ? "protected" : "neutral"} />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">Memorias recientes</h3>
            <span className={badgeClass("neutral")}>{numberLabel(summary.recent_memory.length)}</span>
          </div>
          {summary.recent_memory.length ? summary.recent_memory.map((item) => <MemoryRow key={item.id} item={item} />) : (
            <div className="rounded-3xl border border-white/10 bg-black/15 p-4 text-sm text-slate-400">Aún no hay memorias aprobadas.</div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">Feeds por AGI</h3>
              <span className={badgeClass("active")}>{numberLabel(summary.feed_by_agi.length)}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              {summary.feed_by_agi.length ? summary.feed_by_agi.map((item) => <FeedPill key={item.agi_id} item={item} />) : (
                <div className="rounded-3xl border border-white/10 bg-black/15 p-4 text-sm text-slate-400">Sin feeds activos.</div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Lectura ejecutiva</p>
            <ul className="mt-3 space-y-2">
              {summary.executive_summary.map((item) => (
                <li key={item} className="text-sm leading-6 text-slate-300">{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">Actualizaciones recientes</h3>
          {summary.recent_feed.length ? summary.recent_feed.slice(0, 4).map((item) => <FeedRow key={item.id} item={item} />) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">Sin actualizaciones recientes.</div>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">Prevención y revisión</h3>
          {summary.pending_learning.length ? summary.pending_learning.map((item) => <PendingRow key={item.id} item={item} />) : null}
          {summary.error_patterns.length ? summary.error_patterns.map((item) => <ErrorRow key={item.id} item={item} />) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">Sin errores preventivos todavía.</div>
          )}
        </div>
      </div>
    </section>
  );
}
