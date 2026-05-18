import Link from "next/link";
import { Bot, CheckCircle2, PlugZap, ShieldCheck } from "lucide-react";
import { getAgiRuntimeSummary } from "@/lib/agi-runtime-core";

type Props = { projectId: string };

export default async function AgiRuntimePreview({ projectId }: Props) {
  const summary = await getAgiRuntimeSummary(projectId).catch((error) => ({
    ok: false,
    schema_ready: false,
    counts: { agents: 16, tools_configured: 0, tools_total: 0, actions: 0, runs: 0 },
    integrations: [],
    message: error instanceof Error ? error.message : "AGI Runtime pendiente.",
  }));

  const integrations = Array.isArray(summary.integrations) ? summary.integrations : [];
  const ready = integrations.filter((item) => item.status === "configured").slice(0, 6);

  return (
    <section className="hocker-panel-pro relative overflow-hidden border-cyan-300/15 bg-slate-950/45 p-5 shadow-[0_0_60px_rgba(34,211,238,0.08)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.10),transparent_28%),radial-gradient(circle_at_80%_30%,rgba(168,85,247,0.08),transparent_30%)]" />
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200"><Bot className="h-4 w-4" /> AGI Runtime</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Las AGIs ya tienen capa de ejecución.</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Base real para herramientas, tareas, acciones, runs, feedback y chat realtime. Nada sensible se ejecuta sin aprobación.</p>
        </div>
        <Link href="/chat" className="shell-button-primary w-full justify-center lg:w-auto">Abrir NOVA realtime</Link>
      </div>

      <div className="relative mt-5 grid gap-3 sm:grid-cols-4">
        <div className="hko-mini-stat"><span>AGIs</span><strong>{summary.counts?.agents ?? 16}</strong></div>
        <div className="hko-mini-stat"><span>Tools</span><strong>{summary.counts?.tools_configured ?? 0}/{summary.counts?.tools_total ?? 0}</strong></div>
        <div className="hko-mini-stat"><span>Acciones</span><strong>{summary.counts?.actions ?? 0}</strong></div>
        <div className="hko-mini-stat"><span>Runs</span><strong>{summary.counts?.runs ?? 0}</strong></div>
      </div>

      <div className="relative mt-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-sky-100"><ShieldCheck className="h-3.5 w-3.5" /> Owner Gate</span>
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-100"><CheckCircle2 className="h-3.5 w-3.5" /> Dry-run primero</span>
        {ready.map((tool) => (
          <span key={tool.tool_key} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-200"><PlugZap className="h-3.5 w-3.5 text-cyan-200" /> {tool.name}</span>
        ))}
      </div>
    </section>
  );
}
