import type { HockerLivePulseSummary } from "@/lib/hocker-live-pulse-summary";

type Props = {
  summary: HockerLivePulseSummary;
};

type MetricNodeProps = {
  tone: "cyan" | "violet" | "green" | "amber";
  label: string;
  value: number;
  detail: string;
  className: string;
};

function cleanNumber(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
}

function MetricNode({ tone, label, value, detail, className }: MetricNodeProps) {
  return (
    <div className={`hko-cine-node ${className} is-${tone}`}>
      <span className="hko-cine-node-label">{label}</span>
      <strong>{value}</strong>
      <span>{detail}</span>
    </div>
  );
}

function MiniSignal({ label, value }: { label: string; value: number }) {
  return (
    <div className="hko-cine-signal">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default function EcosystemVfxNetwork({ summary }: Props) {
  const counts = summary?.counts ?? {
    approved_learning: 0,
    active_memory: 0,
    active_agi_updates: 0,
    prevented_errors: 0,
    repeated_seen: 0,
  };

  const memory = cleanNumber(counts.active_memory);
  const learning = cleanNumber(counts.approved_learning);
  const agis = cleanNumber(counts.active_agi_updates);
  const errors = cleanNumber(counts.prevented_errors);
  const dedup = cleanNumber(counts.repeated_seen);
  const latest = summary?.latest_memory;

  return (
    <article className="hko-cine-map" aria-labelledby="hko-cine-title">
      <header className="hko-cine-head">
        <span className="hko-cine-kicker">Mapa visual</span>
        <h2 id="hko-cine-title">NOVA al centro. Todo conectado.</h2>
        <p>
          Datos reales desde Supabase. Sin valores inventados: si algo aparece en cero, todavía no hay registro real.
        </p>
      </header>

      <section className="hko-cine-stage" aria-label="Mapa visual del ecosistema con datos reales">
        <svg className="hko-cine-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="hkoLineA" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="rgba(103,232,249,.08)" />
              <stop offset=".45" stopColor="rgba(103,232,249,.75)" />
              <stop offset="1" stopColor="rgba(168,85,247,.18)" />
            </linearGradient>
          </defs>
          <path d="M50 50 C30 22 18 18 12 18" />
          <path d="M50 50 C70 21 82 19 88 18" />
          <path d="M50 50 C25 70 17 82 12 86" />
          <path d="M50 50 C72 72 83 82 88 86" />
          <circle cx="50" cy="50" r="25" />
          <circle cx="50" cy="50" r="39" />
        </svg>

        <div className="hko-cine-core">
          <span className="hko-cine-core-ring" />
          <span className="hko-cine-core-pulse" />
          <span className="hko-cine-core-title">NOVA</span>
          <span className="hko-cine-core-sub">Núcleo</span>
          <span className="hko-cine-core-meta">coordina · revisa · protege</span>
        </div>

        <MetricNode className="node-memory" tone="green" label="Memoria IA" value={memory} detail="activas" />
        <MetricNode className="node-agis" tone="violet" label="AGIs" value={agis} detail="actualizadas" />
        <MetricNode className="node-dedup" tone="cyan" label="Dedup" value={dedup} detail="sin duplicar" />
        <MetricNode className="node-errors" tone="amber" label="Errores" value={errors} detail="prevenidos" />
      </section>

      <section className="hko-cine-route" aria-label="Ruta real de memoria">
        <span>Candy Ads</span>
        <i aria-hidden="true">→</i>
        <span>Syntia</span>
        <i aria-hidden="true">→</i>
        <span>NOVA</span>
        <i aria-hidden="true">→</i>
        <span>Memoria IA</span>
      </section>

      <section className="hko-cine-footer-grid" aria-label="Resumen real">
        <MiniSignal label="Aprendizajes" value={learning} />
        <MiniSignal label="Feeds AGI" value={agis} />
        <MiniSignal label="Errores prevenidos" value={errors} />
      </section>

      {latest ? (
        <section className="hko-cine-latest" aria-label="Última memoria real">
          <span>Última memoria</span>
          <strong>{latest.title || "Memoria aprobada"}</strong>
          <p>
            Fuente: {latest.source_agi_id || "AGI"}. Veces vista: {cleanNumber(latest.times_seen)}.
          </p>
        </section>
      ) : null}
    </article>
  );
}
