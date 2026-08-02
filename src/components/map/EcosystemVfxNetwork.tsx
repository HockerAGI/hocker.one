import Link from "next/link";
import { Activity, Brain, Network, Search, ShieldCheck, Sparkles } from "lucide-react";
import type { HockerLivePulseSummary } from "@/lib/hocker-live-pulse-summary";
import { AGI_REGISTRY } from "@/lib/hocker-dashboard";
import {
  getHockerOperationalSnapshot,
  type OperationalStatus,
} from "@/lib/hocker-operational-state";

function agiDisplayName(agi: (typeof AGI_REGISTRY)[number]) {
  const raw = agi.title || agi.key || "AGI";
  return String(raw)
    .replace(/^nova-ads$/i, "Nova Ads")
    .replace(/^candy-ads$/i, "Candy Ads")
    .replace(/^pro-ia$/i, "PRO IA")
    .replace(/^chido-wins$/i, "Chido Wins")
    .replace(/^chido-gerente$/i, "Chido Gerente")
    .replace(/^nexpa-agi$/i, "NEXPA")
    .replace(/^trackhok-agi$/i, "TrackHok")
    .replace(/[-_]/g, " ");
}

function canonicalKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replaceAll("_", "-")
    .replace(/^candy$/, "candy-ads")
    .replace(/^nexpa$/, "nexpa-agi")
    .replace(/^trackhok$/, "trackhok-agi");
}

function statusLabel(status: OperationalStatus) {
  if (status === "online") return "Verificado";
  if (status === "degraded") return "Degradado";
  if (status === "configured") return "Configurado";
  if (status === "stale") return "Histórico";
  if (status === "offline") return "Sin señal";
  if (status === "not_created") return "Sin worker";
  return "Sin verificar";
}

function statusClass(status: OperationalStatus) {
  if (status === "online") return "is-online";
  if (status === "degraded" || status === "offline") return "is-error";
  if (status === "configured") return "is-configured";
  if (status === "stale") return "is-stale";
  return "is-missing";
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

export default async function EcosystemVfxNetwork({ summary }: { summary: HockerLivePulseSummary }) {
  const operational = await getHockerOperationalSnapshot();
  const nova = operational.agis.find((agi) => canonicalKey(agi.key) === "nova");
  const agiByKey = new Map(operational.agis.map((agi) => [canonicalKey(agi.key), agi]));
  const visibleProfiles = AGI_REGISTRY.slice(0, 16);
  const verifiedWorkers = operational.agis.filter((agi) => agi.status === "online").length;
  const historicalWorkers = operational.agis.filter((agi) => agi.status === "stale").length;
  const createdApps = operational.apps.filter((app) => app.status !== "not_created").length;
  const notCreatedApps = operational.apps.filter((app) => app.status === "not_created").length;

  return (
    <section className="hko-final-map" aria-labelledby="final-map-title">
      <div className="hko-final-map-bg" aria-hidden="true" />

      <header className="hko-final-map-head">
        <span className="hko-final-pill">
          <Network className="h-4 w-4" />
          Mapa operativo
        </span>
        <h2 id="final-map-title">Arquitectura y evidencia del ecosistema.</h2>
        <p>
          Esta vista separa perfiles documentados, componentes existentes, señales recientes y servicios realmente verificados.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Link href="/catalog" className="hko-final-button inline-flex items-center gap-2">
            <Search className="h-4 w-4" />
            Buscar y verificar estados
          </Link>
          <Link href="/integrations" className="hko-final-button">Herramientas y APIs</Link>
        </div>
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

        <div className={`hko-final-core ${nova ? statusClass(nova.status) : "is-missing"}`}>
          <span className="hko-final-core-halo halo-a" />
          <span className="hko-final-core-halo halo-b" />
          <span className="hko-final-core-halo halo-c" />
          <Brain className="hko-final-core-icon" />
          <strong>NOVA</strong>
          <small>Perfil orquestador</small>
          <em>{nova ? statusLabel(nova.status) : "Sin verificación"}</em>
        </div>

        <CoreMetric label="Servicios" value={operational.metrics.verified_services} text="verificados ahora" tone="mint" />
        <CoreMetric label="Nodos" value={operational.metrics.fresh_nodes} text="heartbeat ≤ 5 min" tone="violet" />
        <CoreMetric label="Runs" value={operational.metrics.runs_24h} text="registrados en 24 h" tone="cyan" />
        <CoreMetric label="Aprobaciones" value={operational.metrics.pending_actions} text="acciones pendientes" tone="amber" />
      </div>

      <div className="hko-final-route" aria-label="Flujo supervisado documentado">
        <span>Solicitud</span>
        <i />
        <span>NOVA</span>
        <i />
        <span>Worker</span>
        <i />
        <span>Owner Gate</span>
        <i />
        <span>Evidencia</span>
      </div>

      <div className="hko-final-map-dashboard">
        <article className="hko-final-panel">
          <div className="hko-final-panel-title">
            <Activity className="h-5 w-5" />
            <div>
              <span>Workers AGI</span>
              <strong>{verifiedWorkers} verificados · {historicalWorkers} históricos</strong>
            </div>
          </div>
          <p>Un perfil registrado no se considera activo sin health check o ejecución reciente.</p>
        </article>

        <article className="hko-final-panel">
          <div className="hko-final-panel-title">
            <Network className="h-5 w-5" />
            <div>
              <span>Aplicaciones y módulos</span>
              <strong>{createdApps} existentes · {notCreatedApps} no creados</strong>
            </div>
          </div>
          <p>Hocker Hub, Hocker Ads y otros conceptos permanecen identificados como no creados hasta tener repositorio y runtime verificable.</p>
        </article>

        <article className="hko-final-panel">
          <div className="hko-final-panel-title">
            <ShieldCheck className="h-5 w-5" />
            <div>
              <span>Registros de memoria</span>
              <strong>{summary.counts.active_memory} habilitados</strong>
            </div>
          </div>
          <p>Son registros persistidos; no se usan como prueba de que SYNTIA u otra AGI esté ejecutándose ahora.</p>
        </article>
      </div>

      <div className="hko-final-agi-board">
        <div className="hko-final-board-head">
          <div>
            <span>{visibleProfiles.length} perfiles canónicos</span>
            <strong>Estado individual basado en evidencia</strong>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/agis" className="hko-final-button">Ver workers</Link>
            <Link href="/status" className="hko-final-button">Ver comprobaciones</Link>
          </div>
        </div>

        <div className="hko-final-agi-grid">
          {visibleProfiles.map((agi) => {
            const state = agiByKey.get(canonicalKey(agi.key));
            const status = state?.status ?? "unknown";
            return (
              <Link key={agi.key} href="/agis" className={`hko-final-agi-chip ${statusClass(status)}`} title={state?.evidence ?? "Sin evidencia disponible"}>
                <Sparkles className="h-4 w-4" />
                <span>{agiDisplayName(agi)}</span>
                <small>{statusLabel(status)}</small>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
