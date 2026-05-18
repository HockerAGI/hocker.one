import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Brain,
  CheckCircle2,
  DatabaseZap,
  Eye,
  GitBranch,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { HockerLivePulseSummary } from "@/lib/hocker-live-pulse-summary";

function pct(value: number) {
  return `${Math.max(7, Math.min(100, value * 18))}%`;
}

function MetricCard({
  label,
  value,
  text,
  tone,
  icon: Icon,
}: {
  label: string;
  value: number;
  text: string;
  tone: "cyan" | "emerald" | "amber" | "violet";
  icon: React.ComponentType<{ className?: string }>;
}) {
  const toneClass =
    tone === "emerald"
      ? "border-emerald-300/20 bg-emerald-300/8 text-emerald-100"
      : tone === "amber"
        ? "border-amber-300/20 bg-amber-300/8 text-amber-100"
        : tone === "violet"
          ? "border-violet-300/20 bg-violet-300/8 text-violet-100"
          : "border-cyan-300/20 bg-cyan-300/8 text-cyan-100";

  const bar =
    tone === "emerald"
      ? "from-emerald-300 to-emerald-300/10"
      : tone === "amber"
        ? "from-amber-300 to-amber-300/10"
        : tone === "violet"
          ? "from-violet-300 to-violet-300/10"
          : "from-cyan-300 to-cyan-300/10";

  return (
    <div className={`relative overflow-hidden rounded-[28px] border p-4 ${toneClass}`}>
      <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-white/10 blur-2xl" />

      <div className="relative flex items-start justify-between gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/45">
          <Icon className="h-5 w-5" />
        </span>
        <strong className="text-4xl font-black tracking-[-0.08em] text-white">{value}</strong>
      </div>

      <div className="relative mt-4">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{label}</p>
        <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
      </div>

      <div className="relative mt-4 h-2 overflow-hidden rounded-full bg-white/8">
        <div className={`h-full rounded-full bg-gradient-to-r ${bar}`} style={{ width: pct(value) }} />
      </div>
    </div>
  );
}

function Step({
  title,
  text,
  active,
}: {
  title: string;
  text: string;
  active: boolean;
}) {
  return (
    <div
      className={[
        "relative min-h-[118px] rounded-[26px] border p-4 transition",
        active
          ? "border-cyan-300/20 bg-cyan-300/8 shadow-[0_0_38px_rgba(34,211,238,0.08)]"
          : "border-white/10 bg-white/[0.035]",
      ].join(" ")}
    >
      {active ? (
        <span className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.75)]" />
      ) : null}

      <h3 className="text-lg font-black tracking-[-0.04em] text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
    </div>
  );
}

export default function OwnerLiveHome({ summary }: { summary: HockerLivePulseSummary }) {
  const latest = summary.latest_memory;
  const hasMemory = summary.counts.active_memory > 0;
  const hasUpdates = summary.counts.active_agi_updates > 0;
  const hasErrors = summary.counts.prevented_errors > 0;
  const hasRepeats = summary.counts.repeated_seen > 0;

  return (
    <section className="relative overflow-hidden rounded-[38px] border border-cyan-300/15 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.12),transparent_32%),rgba(255,255,255,0.035)] p-5 shadow-[0_30px_120px_rgba(0,0,0,0.35)] sm:p-6">
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] [background-size:56px_56px]" />

      <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-100">
            <Activity className="h-4 w-4" />
            Inicio vivo
          </span>

          <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[0.96] tracking-[-0.06em] text-white sm:text-5xl">
            Lo importante de Hocker ONE, claro y en tiempo real.
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
            {summary.message} Si un número aparece en cero, todavía no hay registro real.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/map"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-100 transition hover:bg-cyan-300/15"
          >
            <GitBranch className="h-4 w-4" />
            Mapa
          </Link>
          <Link
            href="/live"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-5 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-emerald-100 transition hover:bg-emerald-300/15"
          >
            <Eye className="h-4 w-4" />
            Sistema en vivo
          </Link>
        </div>
      </div>

      <div className="relative mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Memoria IA"
          value={summary.counts.active_memory}
          text="Aprendizajes aprobados y activos."
          tone="emerald"
          icon={DatabaseZap}
        />
        <MetricCard
          label="Aprendizajes"
          value={summary.counts.approved_learning}
          text="Con revisión completada."
          tone="cyan"
          icon={Sparkles}
        />
        <MetricCard
          label="AGIs actualizadas"
          value={summary.counts.active_agi_updates}
          text="Recibieron una actualización."
          tone="violet"
          icon={Brain}
        />
        <MetricCard
          label="Errores prevenidos"
          value={summary.counts.prevented_errors}
          text="Reglas para no repetir fallos."
          tone="amber"
          icon={ShieldCheck}
        />
        <MetricCard
          label="Repetidos sin duplicar"
          value={summary.counts.repeated_seen}
          text="Detectados sin inflar datos."
          tone="emerald"
          icon={CheckCircle2}
        />
      </div>

      <div className="relative mt-5 grid gap-3 xl:grid-cols-[1fr_0.86fr]">
        <div className="rounded-[32px] border border-white/10 bg-slate-950/45 p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Último aprendizaje</p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.05em] text-white">
                {latest?.title || "Sin memoria activa todavía"}
              </h2>
            </div>
            <DatabaseZap className="h-7 w-7 text-emerald-200" />
          </div>

          <p className="mt-4 text-sm leading-7 text-slate-300">
            {latest
              ? `${latest.source_agi_id || "Una AGI"} compartió una memoria. ${latest.target_agi_ids.length} AGIs pueden usarla. Veces visto: ${latest.times_seen}.`
              : "Cuando NOVA apruebe una memoria, aparecerá aquí sin inventar datos."}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {(latest?.target_agi_ids || []).slice(0, 6).map((agi) => (
              <span
                key={agi}
                className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-2 text-xs font-black text-slate-200"
              >
                {agi}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-slate-950/45 p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Ruta del aprendizaje</p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Step title="Detectado" text="Una AGI encuentra algo útil." active={hasMemory || hasUpdates} />
            <Step title="Revisado" text="Syntia y NOVA lo validan." active={hasMemory} />
            <Step title="Compartido" text="Llega a otras AGIs." active={hasUpdates} />
            <Step title="Protegido" text="Evita repetir errores." active={hasErrors || hasRepeats} />
          </div>

          <Link
            href="/live"
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.045] px-4 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-slate-200 transition hover:bg-white/[0.07]"
          >
            Ver detalle real
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
