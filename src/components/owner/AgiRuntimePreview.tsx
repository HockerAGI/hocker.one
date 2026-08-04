import Link from "next/link";
import { AlertTriangle, Bot, CheckCircle2, Clock3, PlugZap, ShieldCheck } from "lucide-react";
import { getAgiRuntimeSummary } from "@/lib/agi-runtime-core";
import {
  getPersistedRuntimeIntegrations,
  type PersistedRuntimeIntegration,
} from "@/lib/agi-runtime-state";

type Props = { projectId: string };

type IntegrationLike = Pick<
  PersistedRuntimeIntegration,
  "tool_key" | "name" | "status" | "status_label" | "status_hint" | "execution_enabled"
>;

function statusLabel(status: string) {
  if (status === "connected" || status === "configured") return "Conectado";
  if (status === "partial") return "Parcial";
  if (status === "missing_code") return "Falta código";
  if (status === "missing_key" || status === "missing") return "Falta llave";
  if (status === "blocked") return "Bloqueado";
  return "En revisión";
}

function statusClass(status: string) {
  if (status === "connected" || status === "configured") {
    return "border-emerald-300/20 bg-emerald-400/10 text-emerald-100";
  }
  if (status === "partial") {
    return "border-amber-300/20 bg-amber-400/10 text-amber-100";
  }
  if (status === "missing_code") {
    return "border-violet-300/20 bg-violet-400/10 text-violet-100";
  }
  if (status === "blocked") {
    return "border-rose-300/20 bg-rose-400/10 text-rose-100";
  }
  return "border-white/10 bg-white/[0.04] text-slate-300";
}

export default async function AgiRuntimePreview({ projectId }: Props) {
  const summary = await getAgiRuntimeSummary(projectId).catch((error) => ({
    ok: false,
    schema_ready: false,
    counts: { agents: 16, tools_configured: 0, tools_total: 0, actions: 0, runs: 0 },
    integrations: [],
    message: error instanceof Error ? error.message : "Herramientas reales pendiente.",
  }));

  const persisted = await getPersistedRuntimeIntegrations(projectId).catch(() => []);
  const integrations: IntegrationLike[] = persisted.length
    ? persisted
    : Array.isArray(summary.integrations)
      ? (summary.integrations as IntegrationLike[])
      : [];

  const connected = integrations.filter(
    (item) => item.status === "connected" || item.status === "configured",
  );
  const partial = integrations.filter((item) => item.status === "partial");
  const missingCode = integrations.filter((item) => item.status === "missing_code");
  const missingKey = integrations.filter(
    (item) => item.status === "missing_key" || item.status === "missing",
  );
  const blocked = integrations.filter((item) => item.status === "blocked");
  const featured = [
    ...connected,
    ...partial,
    ...missingCode,
    ...missingKey,
    ...blocked,
  ].slice(0, 8);

  return (
    <section className="hocker-panel-pro relative overflow-hidden border-cyan-300/15 bg-slate-950/45 p-5 shadow-[0_0_60px_rgba(34,211,238,0.08)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.10),transparent_28%),radial-gradient(circle_at_80%_30%,rgba(168,85,247,0.08),transparent_30%)]" />
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] text-cyan-200"><Bot className="h-4 w-4" /> Herramientas reales</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white">Herramientas reales, estados honestos.</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">NOVA muestra el último estado persistido y verificado. Ninguna herramienta sensible se ejecuta sin Owner Gate.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href="/chat" className="shell-button-primary justify-center">Abrir Hablar con NOVA</Link>
          <Link href="/owner" className="shell-button-secondary justify-center">Actualizar estado</Link>
        </div>
      </div>

      <div className="relative mt-5 grid gap-3 sm:grid-cols-6">
        <div className="hko-mini-stat"><span>AGIs</span><strong>{summary.counts?.agents ?? 16}</strong></div>
        <div className="hko-mini-stat"><span>Conectadas</span><strong>{connected.length}</strong></div>
        <div className="hko-mini-stat"><span>Parciales</span><strong>{partial.length}</strong></div>
        <div className="hko-mini-stat"><span>Falta código</span><strong>{missingCode.length}</strong></div>
        <div className="hko-mini-stat"><span>Falta llave</span><strong>{missingKey.length}</strong></div>
        <div className="hko-mini-stat"><span>Acciones</span><strong>{summary.counts?.actions ?? 0}</strong></div>
      </div>

      <div className="relative mt-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-sky-100"><ShieldCheck className="h-3.5 w-3.5" /> Owner Gate</span>
        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-100"><CheckCircle2 className="h-3.5 w-3.5" /> Verificación real</span>
        <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-amber-100"><Clock3 className="h-3.5 w-3.5" /> Parcial no ejecuta</span>
        <span className="inline-flex items-center gap-2 rounded-full border border-rose-300/20 bg-rose-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-rose-100"><AlertTriangle className="h-3.5 w-3.5" /> Sin estados inventados</span>
      </div>

      <div className="relative mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {featured.map((tool) => (
          <span
            key={tool.tool_key ?? tool.name}
            title={tool.status_hint}
            className={`inline-flex min-h-12 items-center justify-between gap-2 rounded-2xl border px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] ${statusClass(String(tool.status || "missing_key"))}`}
          >
            <span className="inline-flex items-center gap-2"><PlugZap className="h-3.5 w-3.5" /> {tool.name ?? tool.tool_key}</span>
            <span>{tool.status_label ?? statusLabel(String(tool.status || "missing_key"))}</span>
          </span>
        ))}
      </div>
    </section>
  );
}
