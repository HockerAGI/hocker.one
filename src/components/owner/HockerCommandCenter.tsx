import Link from "next/link";
import { Activity, Brain, CheckSquare, DatabaseZap, Map, ShieldCheck } from "lucide-react";
import type { HockerLivePulseSummary } from "@/lib/hocker-live-pulse-summary";

function n(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? Math.max(0, Math.round(number)) : 0;
}

function CommandCard({
  href,
  label,
  title,
  text,
  icon: Icon,
  tone,
}: {
  href: string;
  label: string;
  title: string;
  text: string;
  icon: typeof Brain;
  tone: "cyan" | "mint" | "violet" | "amber";
}) {
  return (
    <Link href={href} className={`hko-command-card is-${tone}`}>
      <span className="hko-command-icon"><Icon className="h-5 w-5" /></span>
      <small>{label}</small>
      <strong>{title}</strong>
      <p>{text}</p>
    </Link>
  );
}

export default function HockerCommandCenter({ summary }: { summary: HockerLivePulseSummary }) {
  const memory = n(summary.counts.active_memory);
  const updates = n(summary.counts.active_agi_updates);
  const errors = n(summary.counts.prevented_errors);
  const dedup = n(summary.counts.repeated_seen);
  const total = Math.max(1, memory + updates + errors + dedup);

  const bars = [
    { label: "Memoria", value: memory, tone: "mint" },
    { label: "AGIs", value: updates, tone: "violet" },
    { label: "Errores", value: errors, tone: "amber" },
    { label: "Limpieza", value: dedup, tone: "cyan" },
  ];

  return (
    <section className="hko-command-center" aria-labelledby="hko-command-title">
      <div className="hko-command-hero">
        <span className="hko-final-pill">Centro privado</span>
        <h1 id="hko-command-title">Hocker ONE</h1>
        <p>
          Panel principal para ver, entrar y entender el ecosistema sin perderte entre rutas.
        </p>
      </div>

      <div className="hko-command-radar">
        <div className="hko-command-radar-core">
          <Brain className="h-9 w-9" />
          <strong>NOVA</strong>
          <span>núcleo</span>
        </div>
        <div className="hko-command-radar-ring ring-a" />
        <div className="hko-command-radar-ring ring-b" />
        <div className="hko-command-radar-ring ring-c" />
      </div>

      <div className="hko-command-metrics">
        {bars.map((item) => (
          <article key={item.label} className={`hko-command-bar is-${item.tone}`}>
            <div>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
            <i style={{ width: `${Math.max(8, Math.round((item.value / total) * 100))}%` }} />
          </article>
        ))}
      </div>

      <div className="hko-command-grid">
        <CommandCard href="/map" label="Mapa" title="Ver todo" text="Mapa claro del ecosistema." icon={Map} tone="cyan" />
        <CommandCard href="/live" label="Vivo" title="Pulso real" text="Estado, memoria y nodos." icon={Activity} tone="mint" />
        <CommandCard href="/chat" label="NOVA" title="Resolver" text="Canal central del sistema." icon={Brain} tone="violet" />
        <CommandCard href="/commands" label="Tareas" title="Revisar" text="Acciones y aprobaciones." icon={CheckSquare} tone="amber" />
        <CommandCard href="/memory" label="Memoria" title="Aprender" text="Contexto aprobado." icon={DatabaseZap} tone="mint" />
        <CommandCard href="/security" label="Seguridad" title="Proteger" text="Permisos y acceso owner." icon={ShieldCheck} tone="cyan" />
      </div>
    </section>
  );
}
