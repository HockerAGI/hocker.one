import type { HockerLivePulseSummary } from "@/lib/hocker-live-pulse-summary";
import { humanAgiName, humanLearningTitle } from "@/lib/hocker-human-labels";

type Props = {
  summary: HockerLivePulseSummary;
};

type MetricTone = "mint" | "cyan" | "violet" | "amber";

type MetricNode = {
  id: "memory" | "agis" | "dedup" | "errors";
  label: string;
  value: number;
  detail: string;
  tone: MetricTone;
};

function cleanNumber(value: unknown) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? Math.max(0, Math.round(n)) : 0;
}

function MetricCard({ item }: { item: MetricNode }) {
  return (
    <article className={`hko-neo-metric hko-neo-${item.id} is-${item.tone}`}>
      <span>{item.label}</span>
      <strong>{item.value}</strong>
      <p>{item.detail}</p>
    </article>
  );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <article className="hko-neo-mini">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
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

  const learning = cleanNumber(counts.approved_learning);
  const memory = cleanNumber(counts.active_memory);
  const agis = cleanNumber(counts.active_agi_updates);
  const errors = cleanNumber(counts.prevented_errors);
  const dedup = cleanNumber(counts.repeated_seen);
  const latest = summary?.latest_memory;

  const nodes: MetricNode[] = [
    { id: "memory", label: "Memoria IA", value: memory, detail: "activa", tone: "mint" },
    { id: "agis", label: "AGIs", value: agis, detail: "actualizadas", tone: "violet" },
    { id: "dedup", label: "Dedup", value: dedup, detail: "sin duplicar", tone: "cyan" },
    { id: "errors", label: "Errores", value: errors, detail: "prevenidos", tone: "amber" },
  ];

  const latestTitle = latest ? humanLearningTitle(latest.title, latest.source_agi_id) : "Sin memoria activa todavía";
  const source = latest ? humanAgiName(latest.source_agi_id) : "Syntia";

  return (
    <article className="hko-neo-map" aria-labelledby="hko-neo-map-title">
      <header className="hko-neo-hero">
        <span className="hko-neo-kicker">Mapa vivo</span>
        <h2 id="hko-neo-map-title">NOVA al centro.</h2>
        <p>Todo conectado con datos reales. Sin relleno, sin valores inventados.</p>
      </header>

      <section className="hko-neo-stage" aria-label="Mapa animado del ecosistema HOCKER con datos reales">
        <svg className="hko-neo-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="hkoNeoLine" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="rgba(128,255,219,.12)" />
              <stop offset=".48" stopColor="rgba(76,229,255,.88)" />
              <stop offset="1" stopColor="rgba(175,120,255,.18)" />
            </linearGradient>
          </defs>
          <path d="M50 50 C30 20 19 20 13 22" />
          <path d="M50 50 C72 18 83 20 88 24" />
          <path d="M50 50 C27 74 18 79 14 84" />
          <path d="M50 50 C72 74 82 79 87 84" />
          <circle className="orbit" cx="50" cy="50" r="18" />
          <circle className="orbit" cx="50" cy="50" r="32" />
          <circle className="orbit" cx="50" cy="50" r="43" />
          <circle className="pulse-dot dot-a" cx="13" cy="22" r="1.2" />
          <circle className="pulse-dot dot-b" cx="88" cy="24" r="1.2" />
          <circle className="pulse-dot dot-c" cx="14" cy="84" r="1.2" />
          <circle className="pulse-dot dot-d" cx="87" cy="84" r="1.2" />
        </svg>

        <div className="hko-neo-core" aria-label="NOVA núcleo central">
          <span className="hko-neo-core-orbit orbit-one" />
          <span className="hko-neo-core-orbit orbit-two" />
          <span className="hko-neo-core-orbit orbit-three" />
          <span className="hko-neo-core-glow" />
          <strong>NOVA</strong>
          <small>Núcleo</small>
          <em>ordena · conecta · protege</em>
        </div>

        {nodes.map((item) => <MetricCard key={item.id} item={item} />)}
      </section>

      <section className="hko-neo-route" aria-label="Ruta real del aprendizaje">
        <span>Candy Ads</span><i aria-hidden="true" />
        <span>Syntia</span><i aria-hidden="true" />
        <span>NOVA</span><i aria-hidden="true" />
        <span>Memoria IA</span>
      </section>

      <section className="hko-neo-grid" aria-label="Números reales del sistema">
        <MiniMetric label="Aprendizajes" value={learning} />
        <MiniMetric label="Feeds AGI" value={agis} />
        <MiniMetric label="Errores prevenidos" value={errors} />
      </section>

      <section className="hko-neo-latest" aria-label="Última memoria real">
        <span>Última memoria</span>
        <strong>{latestTitle}</strong>
        <p>Fuente: {source}. Veces vista: {cleanNumber(latest?.times_seen)}.</p>
      </section>
    </article>
  );
}
