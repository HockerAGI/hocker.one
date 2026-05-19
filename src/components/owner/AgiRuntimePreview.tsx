import Link from "next/link";
import { AlertTriangle, Bot, CheckCircle2, Clock3, PlugZap, ShieldCheck, XCircle } from "lucide-react";
import { getAgiRuntimeSummary } from "@/lib/agi-runtime-core";

type Props = { projectId: string };

type RuntimeIntegrationPreview = {
  tool_key: string;
  name: string;
  provider?: string;
  status: "connected" | "partial" | "missing_key" | "missing_code" | "blocked" | string;
  status_label?: string;
  status_hint?: string;
  next_step?: string;
};

function statusStyle(status: string) {
  if (status === "connected") return "border-emerald-300/20 bg-emerald-400/10 text-emerald-100";
  if (status === "partial") return "border-amber-300/20 bg-amber-400/10 text-amber-100";
  if (status === "missing_code") return "border-rose-300/20 bg-rose-400/10 text-rose-100";
  if (status === "blocked") return "border-red-300/20 bg-red-400/10 text-red-100";
  return "border-slate-300/15 bg-white/[0.04] text-slate-200";
}

function statusIcon(status: string) {
  if (status === "connected") return CheckCircle2;
  if (status === "partial") return Clock3;
  if (status === "missing_code") return XCircle;
  if (status === "blocked") return ShieldCheck;
  return AlertTriangle;
}

export default async function AgiRuntimePreview({ projectId }: Props) {
  const summary = await getAgiRuntimeSummary(projectId).catch((error) => ({
    ok: false,
    schema_ready: false,
    counts: {
      agents: 16,
      tools_configured: 0,
      tools_connected: 0,
      tools_partial: 0,
      tools_missing_key: 0,
      tools_missing_code: 0,
      tools_total: 0,
      actions: 0,
      runs: 0,
    },
    integrations: [] as RuntimeIntegrationPreview[],
    message: error instanceof Error ? error.message : "AGI Runtime pendiente.",
  }));

  const integrations = Array.isArray(summary.integrations) ? (summary.integrations as RuntimeIntegrationPreview[]) : [];
  const visible = integrations
    .sort((a, b) => {
      const order: Record<string, number> = { connected: 0, partial: 1, missing_key: 2, missing_code: 3, blocked: 4 };
      return (order[a.status] ?? 9) - (order[b.status] ?? 9);
    })
    .slice(0, 10);

  const connected = summary.counts?.tools_connected ?? summary.counts?.tools_configured ?? 0;
  const partial = summary.counts?.tools_partial ?? 0;
  const missingKey = summary.counts?.tools_missing_key ?? 0;
  const missingCode = summary.counts?.tools_missing_code ?? 0;

  return (
    <section className="hocker-panel-pro relative overflow-hidden border-cyan-300/15 bg-slate-950/45 p-5 shadow-[0_0_60px_rgba(34,211,238,0.08)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.10),transparent_28%),radial-gradient(circle_at_80%_30%,rgba(168,85,247,0.08),transparent_30%)]" />

      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200">
            <Bot className="h-4 w-4" /> AGI Runtime · herramientas reales
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Catálogo normalizado para ejecución real.</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            Muestra qué está conectado, qué está parcial y qué falta. No expone secretos y nada sensible se ejecuta sin aprobación.
          </p>
        </div>
        <Link href="/chat" className="shell-button-primary w-full justify-center lg:w-auto">Abrir NOVA realtime</Link>
      </div>

      <div className="relative mt-5 grid gap-3 sm:grid-cols-5">
        <div className="hko-mini-stat"><span>AGIs</span><strong>{summary.counts?.agents ?? 16}</strong></div>
        <div className="hko-mini-stat"><span>Conectadas</span><strong>{connected}</strong></div>
        <div className="hko-mini-stat"><span>Parcial</span><strong>{partial}</strong></div>
        <div className="hko-mini-stat"><span>Falta llave</span><strong>{missingKey}</strong></div>
        <div className="hko-mini-stat"><span>Falta código</span><strong>{missingCode}</strong></div>
      </div>

      <div className="relative mt-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-sky-100">
          <ShieldCheck className="h-3.5 w-3.5" /> Owner Gate
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-100">
          <CheckCircle2 className="h-3.5 w-3.5" /> Dry-run primero
        </span>
        {visible.map((tool) => {
          const Icon = statusIcon(tool.status);
          return (
            <span
              key={tool.tool_key}
              className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] ${statusStyle(tool.status)}`}
              title={tool.status_hint || tool.next_step || tool.provider || tool.name}
            >
              <Icon className="h-3.5 w-3.5" /> {tool.name}: {tool.status_label || tool.status}
            </span>
          );
        })}
      </div>

      <div className="relative mt-4 rounded-3xl border border-white/10 bg-black/20 p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Siguiente acción correcta</p>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          Normalizado el catálogo, el primer executor real recomendado es GitHub: lectura de repo, árbol, archivos, rama, upsert y PR con aprobación.
        </p>
      </div>
    </section>
  );
}
