import Link from "next/link";
import type { HockerLivePulseSummary } from "@/lib/hocker-live-pulse-summary";

type NodeTone = "core" | "memory" | "security" | "creative" | "ops" | "business";

function nodeClass(tone: NodeTone) {
  const base = "hocker-network-node";
  if (tone === "core") return `${base} hocker-network-node-core`;
  if (tone === "memory") return `${base} hocker-network-node-memory`;
  if (tone === "security") return `${base} hocker-network-node-security`;
  if (tone === "creative") return `${base} hocker-network-node-creative`;
  if (tone === "business") return `${base} hocker-network-node-business`;
  return `${base} hocker-network-node-ops`;
}

function NetworkNode({
  label,
  value,
  text,
  tone,
  href,
}: {
  label: string;
  value: string | number;
  text: string;
  tone: NodeTone;
  href: string;
}) {
  return (
    <Link href={href} className={nodeClass(tone)}>
      <span className="hocker-network-node-glow" />
      <span className="hocker-network-node-label">{label}</span>
      <strong>{value}</strong>
      <small>{text}</small>
    </Link>
  );
}

export default function EcosystemVfxNetwork({ summary }: { summary: HockerLivePulseSummary }) {
  const memory = summary.counts.active_memory;
  const updates = summary.counts.active_agi_updates;
  const errors = summary.counts.prevented_errors;
  const repeats = summary.counts.repeated_seen;

  return (
    <section className="hocker-network-panel">
      <div className="hocker-network-bg" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>

      <div className="hocker-network-head">
        <p>Mapa visual</p>
        <h2>NOVA al centro. Todo conectado.</h2>
        <span>Datos reales desde Supabase.</span>
      </div>

      <div className="hocker-network-stage">
        <div className="hocker-network-ring hocker-network-ring-a" />
        <div className="hocker-network-ring hocker-network-ring-b" />
        <div className="hocker-network-core">
          <span className="hocker-network-core-pulse" />
          <strong>NOVA</strong>
          <small>Núcleo</small>
        </div>

        <div className="hocker-network-orbit hocker-network-orbit-top">
          <NetworkNode label="Memoria IA" value={memory} text="aprendizajes" tone="memory" href="/live" />
        </div>

        <div className="hocker-network-orbit hocker-network-orbit-right">
          <NetworkNode label="AGIs" value={updates} text="actualizadas" tone="creative" href="/agis" />
        </div>

        <div className="hocker-network-orbit hocker-network-orbit-bottom">
          <NetworkNode label="Errores" value={errors} text="prevenidos" tone="security" href="/security" />
        </div>

        <div className="hocker-network-orbit hocker-network-orbit-left">
          <NetworkNode label="Dedup" value={repeats} text="sin duplicar" tone="ops" href="/memory" />
        </div>

        <div className="hocker-network-connector hocker-network-connector-v" />
        <div className="hocker-network-connector hocker-network-connector-h" />
      </div>

      <div className="hocker-network-flow">
        <span>Candy Ads</span>
        <b>→</b>
        <span>Syntia</span>
        <b>→</b>
        <span>NOVA</span>
        <b>→</b>
        <span>Memoria IA</span>
      </div>
    </section>
  );
}
