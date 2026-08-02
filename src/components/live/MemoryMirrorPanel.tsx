import type { HockerMemoryMirrorLiveSummary } from "@/lib/hocker-memory-mirror-live-summary";

function formatDate(value: string | null) {
  if (!value) return "Sin fecha registrada";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha inválida";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Tijuana",
  }).format(date);
}

function numberLabel(value: number | null | undefined) {
  return new Intl.NumberFormat("es-MX").format(value ?? 0);
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
    trackhok: "TrackHok",
    nexpa: "NEXPA",
    chido_wins: "Chido Wins",
    chido_gerente: "Chido Gerente",
    shadows: "Shadows IA",
  };
  return map[value] || value;
}

function MetricCard({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <article className="rounded-[24px] border border-white/10 bg-white/[0.04] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <strong className="mt-3 block text-3xl font-black tracking-[-0.05em] text-white">{numberLabel(value)}</strong>
      <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
    </article>
  );
}

export default function MemoryMirrorPanel({ summary }: { summary: HockerMemoryMirrorLiveSummary }) {
  return (
    <section className="rounded-[34px] border border-teal-300/15 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.12),transparent_36%),rgba(255,255,255,0.035)] p-5 shadow-[0_24px_95px_rgba(0,0,0,0.30)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-teal-200">Memoria espejo · registros persistidos</p>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">Conocimiento almacenado y revisiones</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Estos valores provienen de tablas de memoria, feeds, aprendizaje y patrones de error. No prueban que SYNTIA u otra AGI esté ejecutándose ahora.
          </p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">
          Consultado {formatDate(summary.generated_at)}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Memorias habilitadas" value={summary.approved_memory_count} detail="Registros aprobados y marcados como disponibles." />
        <MetricCard label="Feeds registrados" value={summary.active_feed_count} detail="Actualizaciones almacenadas por perfil AGI." />
        <MetricCard label="Patrones de error" value={summary.prevented_error_count} detail="Patrones guardados para revisión y prevención futura." />
        <MetricCard label="Coincidencias deduplicadas" value={summary.dedup_hits} detail="Repeticiones detectadas por la capa de persistencia." />
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">Memorias registradas</h3>
            <span className="text-xs text-slate-500">{summary.recent_memory.length} mostradas</span>
          </div>

          {summary.recent_memory.length ? summary.recent_memory.map((item) => (
            <article key={item.id} className="rounded-3xl border border-white/10 bg-black/15 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200">
                    {agiLabel(item.source_agi_id || "agi")} → {item.target_agi_ids.map(agiLabel).join(" / ") || "Sin destino registrado"}
                  </p>
                  <h4 className="mt-2 text-sm font-black leading-6 text-white">{item.title}</h4>
                  <p className="mt-2 text-xs text-slate-500">Último registro: {formatDate(item.last_seen_at || item.created_at)}</p>
                </div>
                <span className={item.active
                  ? "rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-emerald-100"
                  : "rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-slate-400"}>
                  {item.active ? "Habilitada" : "Deshabilitada"}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-400">
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">Consultas: {numberLabel(item.times_seen)}</span>
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1">Retención: {item.retention_tier || "sin clasificar"}</span>
                {item.prevents_error ? <span className="rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-sky-100">Marcada para prevención</span> : null}
              </div>
            </article>
          )) : (
            <div className="rounded-3xl border border-dashed border-white/10 p-5 text-sm text-slate-500">No hay memorias aprobadas registradas.</div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">Feeds agrupados</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              {summary.feed_by_agi.length ? summary.feed_by_agi.map((item) => (
                <article key={item.agi_id} className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="font-black text-white">{agiLabel(item.agi_id)}</h4>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-black text-slate-300">{numberLabel(item.count)}</span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-400">{item.latest_title}</p>
                  <p className="mt-2 text-[11px] text-slate-600">Último registro: {formatDate(item.last_seen_at)}</p>
                </article>
              )) : (
                <div className="rounded-3xl border border-dashed border-white/10 p-5 text-sm text-slate-500">No hay feeds registrados.</div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Resumen almacenado</p>
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
          <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">Actualizaciones almacenadas</h3>
          {summary.recent_feed.length ? summary.recent_feed.slice(0, 4).map((item) => (
            <article key={item.id} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">{agiLabel(item.agi_id)} · {item.update_type || "actualización"}</p>
              <h4 className="mt-1 text-sm font-bold leading-6 text-white">{item.title}</h4>
              <p className="mt-1 text-xs text-slate-500">Estado guardado: {item.status || "sin estado"} · {formatDate(item.last_seen_at || item.created_at)}</p>
            </article>
          )) : <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-500">No hay actualizaciones registradas.</div>}
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">Revisión y patrones</h3>
          {summary.pending_learning.map((item) => (
            <article key={item.id} className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.04] px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-200">{agiLabel(item.source_agi_id || "agi")} · {item.update_type || "aprendizaje"}</p>
              <h4 className="mt-1 text-sm font-bold leading-6 text-white">{item.learning_title}</h4>
              <p className="mt-1 text-xs text-slate-500">Estado guardado: {item.status || "pendiente"} · {formatDate(item.created_at)}</p>
            </article>
          ))}
          {summary.error_patterns.map((item) => (
            <article key={item.id} className="rounded-2xl border border-sky-300/10 bg-sky-300/[0.035] px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-sky-200">Patrón de error registrado</p>
              <h4 className="mt-1 text-sm font-bold leading-6 text-white">{item.error_title}</h4>
              <p className="mt-1 text-xs text-slate-500">Repeticiones: {numberLabel(item.times_seen)} · Severidad: {item.severity || "sin clasificar"} · {formatDate(item.last_seen_at || item.created_at)}</p>
            </article>
          ))}
          {summary.pending_learning.length === 0 && summary.error_patterns.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-slate-500">No hay elementos pendientes ni patrones registrados.</div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
