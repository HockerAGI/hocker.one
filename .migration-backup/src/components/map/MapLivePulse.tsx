import Link from "next/link";
import { Activity, Brain, DatabaseZap, ShieldCheck, Sparkles } from "lucide-react";
import type { HockerLivePulseSummary } from "@/lib/hocker-live-pulse-summary";
import { humanAgiName, humanLearningTitle } from "@/lib/hocker-human-labels";

function Metric({
  label,
  value,
  tone = "cyan",
}: {
  label: string;
  value: number;
  tone?: "cyan" | "emerald" | "amber" | "violet";
}) {
  const glow =
    tone === "emerald"
      ? "from-emerald-300/45 to-emerald-300/5 text-emerald-100"
      : tone === "amber"
        ? "from-amber-300/45 to-amber-300/5 text-amber-100"
        : tone === "violet"
          ? "from-violet-300/45 to-violet-300/5 text-violet-100"
          : "from-cyan-300/45 to-cyan-300/5 text-cyan-100";

  const width = Math.max(8, Math.min(100, value * 18));

  return (
    <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-slate-950/45 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">{label}</p>
        <strong className={`text-3xl font-black tracking-[-0.06em] ${glow.split(" ").slice(-1)[0]}`}>{value}</strong>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${glow} transition-all duration-700`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

export default function MapLivePulse({ summary }: { summary: HockerLivePulseSummary }) {
  const latest = summary.latest_memory;
  const targets = latest?.target_agi_ids?.length || 0;

  return (
    <section className="relative overflow-hidden rounded-[36px] border border-emerald-300/15 bg-[radial-gradient(circle_at_top_left,rgba(52,211,153,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.12),transparent_32%),rgba(255,255,255,0.035)] p-5 shadow-[0_30px_120px_rgba(0,0,0,0.34)]">
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] [background-size:54px_54px]" />

      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-emerald-100">
            <Activity className="h-4 w-4" />
            Pulso real
          </span>

          <h2 className="mt-4 text-2xl font-black leading-none tracking-[-0.05em] text-white sm:text-4xl">
            El sistema ya está contando lo que pasa.
          </h2>

          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            {summary.message} Si algo está en cero, todavía no existe registro real.
          </p>
        </div>

        <Link
          href="/live"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-100 transition hover:bg-cyan-300/15"
        >
          <Brain className="h-4 w-4" />
          Ver sistema en vivo
        </Link>
      </div>

      <div className="relative mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <Metric label="Memoria IA" value={summary.counts.active_memory} tone="emerald" />
        <Metric label="Aprendizajes" value={summary.counts.approved_learning} tone="cyan" />
        <Metric label="AGIs actualizadas" value={summary.counts.active_agi_updates} tone="violet" />
        <Metric label="Errores prevenidos" value={summary.counts.prevented_errors} tone="amber" />
        <Metric label="Repetidos sin duplicar" value={summary.counts.repeated_seen} tone="emerald" />
      </div>

      <div className="relative mt-4 grid gap-3 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-[30px] border border-white/10 bg-slate-950/45 p-5">
          <div className="flex items-center gap-3">
            <DatabaseZap className="h-5 w-5 text-emerald-200" />
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Último aprendizaje</p>
          </div>

          <h3 className="mt-4 text-xl font-black tracking-[-0.04em] text-white">
            {humanLearningTitle(latest?.title, latest?.source_agi_id)}
          </h3>

          <p className="mt-3 text-sm leading-7 text-slate-300">
            {latest
              ? `${humanAgiName(latest.source_agi_id)} compartió una memoria. ${targets} AGIs pueden usarla. Veces visto: ${latest.times_seen}.`
              : "Cuando NOVA apruebe una memoria, aparecerá aquí con datos reales."}
          </p>
        </div>

        <div className="rounded-[30px] border border-white/10 bg-slate-950/45 p-5">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-cyan-200" />
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">Ruta clara</p>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-sm font-black text-white">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">Candy Ads</span>
            <span className="text-cyan-200">→</span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">Syntia</span>
            <span className="text-cyan-200">→</span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">NOVA</span>
            <span className="text-cyan-200">→</span>
            <span className="rounded-full border border-emerald-300/15 bg-emerald-300/10 px-3 py-2 text-emerald-100">Memoria IA</span>
          </div>

          <div className="mt-5 flex items-center gap-2 text-xs font-bold text-slate-400">
            <Sparkles className="h-4 w-4 text-amber-200" />
            Sin datos falsos. Solo señales reales.
          </div>
        </div>
      </div>
    </section>
  );
}
