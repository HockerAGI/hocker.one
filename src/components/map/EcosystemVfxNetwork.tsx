import Link from "next/link";
import { Activity, Brain, DatabaseZap, Network, ShieldCheck, Sparkles } from "lucide-react";
import type { HockerLivePulseSummary } from "@/lib/hocker-live-pulse-summary";
import { AGI_REGISTRY } from "@/lib/hocker-dashboard";

function n(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? Math.max(0, Math.round(number)) : 0;
}

function cleanTitle(value: unknown) {
  const text = String(value || "Sin memoria activa todavía");
  return text
    .replace(/^Sprint\s+\S+\s+/i, "")
    .replace(/\d{4}-\d{2}-\d{2}T\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sourceName(value: unknown) {
  const raw = String(value || "syntia").replace(/[-_]/g, " ");
  return raw
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}


function agiDisplayName(agi: (typeof AGI_REGISTRY)[number]) {
  const item = agi as unknown as {
    name?: string;
    title?: string;
    label?: string;
    key?: string;
    id?: string;
    slug?: string;
  };

  const raw = item.name || item.title || item.label || item.key || item.id || item.slug || "AGI";

  return String(raw)
    .replace(/^nova-ads$/i, "Nova Ads")
    .replace(/^candy-ads$/i, "Candy Ads")
    .replace(/^pro-ia$/i, "PRO IA")
    .replace(/^chido-wins$/i, "Chido Wins")
    .replace(/^chido-gerente$/i, "Chido Gerente")
    .replace(/^nexpa-agi$/i, "NEXPA")
    .replace(/^trackhok-agi$/i, "TrackHok")
    .replace(/[-_]/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => {
      if (word.toLowerCase() === "ia") return "IA";
      if (word.toLowerCase() === "agi") return "AGI";
      if (word.toLowerCase() === "nova") return "NOVA";
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

function CoreMetric({ label, value, text, tone }: { label: string; value: number; text: string; tone: string }) {
  return (
    <article className={`hko-final-map-metric is-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{text}</p>
    </article>
  );
}

export default function EcosystemVfxNetwork({ summary }: { summary: HockerLivePulseSummary }) {
  const counts = summary.counts;
  const activeMemory = n(counts.active_memory);
  const activeUpdates = n(counts.active_agi_updates);
  const preventedErrors = n(counts.prevented_errors);
  const repeatedSeen = n(counts.repeated_seen);
  const approved = n(counts.approved_learning);
  const latest = summary.latest_memory;

  const topAgis = AGI_REGISTRY.slice(0, 16);

  return (
    <section className="hko-final-map" aria-labelledby="final-map-title">
      <div className="hko-final-map-bg" aria-hidden="true" />

      <header className="hko-final-map-head">
        <span className="hko-final-pill">
          <Network className="h-4 w-4" />
          Mapa vivo
        </span>
        <h2 id="final-map-title">NOVA controla el ecosistema.</h2>
        <p>
          Una vista clara para entender qué está activo, qué aprende y qué protege el sistema. Datos reales, sin valores falsos.
        </p>
      </header>

      <div className="hko-final-stage">
        <svg className="hko-final-stage-lines" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="hkoFinalLine" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0" stopColor="rgba(127,249,255,.08)" />
              <stop offset=".52" stopColor="rgba(127,249,255,.95)" />
              <stop offset="1" stopColor="rgba(174,130,255,.12)" />
            </linearGradient>
          </defs>
          <path d="M50 50 C31 20 18 18 10 22" />
          <path d="M50 50 C70 18 84 19 91 24" />
          <path d="M50 50 C30 80 17 82 11 88" />
          <path d="M50 50 C72 80 84 82 91 88" />
          <circle cx="50" cy="50" r="17" />
          <circle cx="50" cy="50" r="30" />
          <circle cx="50" cy="50" r="43" />
        </svg>

        <div className="hko-final-core">
          <span className="hko-final-core-halo halo-a" />
          <span className="hko-final-core-halo halo-b" />
          <span className="hko-final-core-halo halo-c" />
          <Brain className="hko-final-core-icon" />
          <strong>NOVA</strong>
          <small>Núcleo central</small>
          <em>decide · conecta · protege</em>
        </div>

        <CoreMetric label="Memoria IA" value={activeMemory} text="aprendizajes activos" tone="mint" />
        <CoreMetric label="AGIs" value={activeUpdates} text="señales activas" tone="violet" />
        <CoreMetric label="Dedup" value={repeatedSeen} text="sin duplicar" tone="cyan" />
        <CoreMetric label="Errores" value={preventedErrors} text="prevenidos" tone="amber" />
      </div>

      <div className="hko-final-route" aria-label="Ruta del aprendizaje">
        <span>Candy Ads</span>
        <i />
        <span>Syntia</span>
        <i />
        <span>NOVA</span>
        <i />
        <span>Memoria IA</span>
      </div>

      <div className="hko-final-map-dashboard">
        <article className="hko-final-panel">
          <div className="hko-final-panel-title">
            <DatabaseZap className="h-5 w-5" />
            <div>
              <span>Última memoria</span>
              <strong>{cleanTitle(latest?.title)}</strong>
            </div>
          </div>
          <p>Fuente: {sourceName(latest?.source_agi_id)} · Veces vista: {n(latest?.times_seen)}</p>
        </article>

        <article className="hko-final-panel">
          <div className="hko-final-panel-title">
            <Activity className="h-5 w-5" />
            <div>
              <span>Lectura rápida</span>
              <strong>{approved} aprendizajes aprobados</strong>
            </div>
          </div>
          <p>La pantalla muestra el estado real guardado en el sistema. Si no hay datos, marca cero.</p>
        </article>

        <article className="hko-final-panel">
          <div className="hko-final-panel-title">
            <ShieldCheck className="h-5 w-5" />
            <div>
              <span>Seguridad</span>
              <strong>Rutas privadas</strong>
            </div>
          </div>
          <p>El mapa vive dentro del acceso owner. Sin sesión, redirige al login.</p>
        </article>
      </div>

      <div className="hko-final-agi-board">
        <div className="hko-final-board-head">
          <div>
            <span>16 AGIs</span>
            <strong>Jerarquía visible</strong>
          </div>
          <Link href="/agis" className="hko-final-button">
            Ver AGIs
          </Link>
        </div>

        <div className="hko-final-agi-grid">
          {topAgis.map((agi, index) => (
            <Link key={agi.key} href="/agis" className={`hko-final-agi-chip ${index < 4 ? "is-core" : ""}`}>
              <Sparkles className="h-4 w-4" />
              <span>{agiDisplayName(agi)}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
