import Link from "next/link";
import { AlertTriangle, Bot, CheckCircle2, Clock3, PlugZap, ShieldCheck } from "lucide-react";
import { getAgiRuntimeSummary } from "@/lib/agi-runtime-core";

type Props = { projectId: string };

type IntegrationLike = {
  tool_key?: string;
  name?: string;
  status?: string;
};

function statusLabel(status: string) {
  if (status === "configured") return "Conectado";
  if (status === "partial") return "Parcial";
  if (status === "blocked") return "Bloqueado";
  return "Falta llave";
}

function statusClass(status: string) {
  if (status === "configured") return "border-emerald-300/20 bg-emerald-400/10 text-emerald-100";
  if (status === "partial") return "border-amber-300/20 bg-amber-400/10 text-amber-100";
  if (status === "blocked") return "border-rose-300/20 bg-rose-400/10 text-rose-100";
  return "border-white/10 bg-white/[0.04] text-slate-300";
}

export default async function AgiRuntimePreview({ projectId }: Props) {
  const summary = await getAgiRuntimeSummary(projectId).catch((error) => ({
    ok: false,
    schema_ready: false,
    counts: { agents: 16, tools_configured: 0, tools_total: 0, actions: 0, runs: 0 },
    integrations: [],
    message: error instanceof Error ? error.message : "AGI Runtime pendiente.",
  }));

  const integrations = Array.isArray(summary.integrations) ? (summary.integrations as IntegrationLike[]) : [];
  const configured = integrations.filter((item) => item.status === "configured");
  const partial = integrations.filter((item) => item.status === "partial");
  const missing = integrations.filter((item) => item.status === "missing");
  const featured = [...configured, ...partial, ...missing].slice(0, 8);

  return (
    <section className="hocker-panel-pro relative overflow-hidden border-cyan-300/15 bg-slate-950/45 p-5 shadow-[0_0_60px_rgba(34,211,238,0.08)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.10),transparent_28%),radial-gradient(circle_at_80%_30%,rgba(168,85,247,0.08),transparent_30%)]" />
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200"><Bot className="h-4 w-4" /> AGI Runtime</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Herramientas reales, estados honestos.</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">NOVA puede ver qué está conectado, qué está parcial y qué falta. Nada sensible se ejecuta sin aprobación owner.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href="/chat" className="shell-button-primary justify-center">Abrir NOVA realtime</Link>
          <Link href="/owner" className="shell-button-secondary justify-center">Actualizar estado</Link>
        </div>
      </div>

      <div className="relative mt-5 grid gap-3 sm:grid-cols-5">
        <div className="hko-mini-stat"><span>AGIs</span><strong>{summary.counts?.agents ?? 16}</strong></div>
        <div className="hko-mini-stat"><span>Conectadas</span><strong>{configured.length}</strong></div>
        <div className="hko-mini-stat"><span>Parciales</span><strong>{partial.length}</strong></div>
        <div className="hko-mini-stat"><span>Faltan</span><strong>{missing.length}</strong></div>
        <div className="hko-mini-stat"><span>Acciones</span><strong>{summary.counts?.actions ?? 0}</strong></div>
      </div>

      <div className="relative mt-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-sky-100"><ShieldCheck className="h-3.5 w-3.5" /> Owner Gate</span>
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-100"><CheckCircle2 className="h-3.5 w-3.5" /> Dry-run primero</span>
        <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-amber-100"><Clock3 className="h-3.5 w-3.5" /> Parcial no ejecuta</span>
        <span className="inline-flex items-center gap-2 rounded-full border border-rose-300/20 bg-rose-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-rose-100"><AlertTriangle className="h-3.5 w-3.5" /> Faltan llaves</span>
      </div>

      <div className="relative mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {featured.map((tool) => (
          <span key={tool.tool_key ?? tool.name} className={`inline-flex min-h-12 items-center justify-between gap-2 rounded-2xl border px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] ${statusClass(String(tool.status || "missing"))}`}>
            <span className="inline-flex items-center gap-2"><PlugZap className="h-3.5 w-3.5" /> {tool.name ?? tool.tool_key}</span>
            <span>{statusLabel(String(tool.status || "missing"))}</span>
          </span>
        ))}
      </div>
    </section>
  );
}
