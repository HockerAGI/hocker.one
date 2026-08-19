import type { Metadata } from "next";
import { AlertTriangle, Bot, CheckCircle2, ChevronDown, Clock3 } from "lucide-react";
import AgiEvalBatchControl from "@/components/agi/AgiEvalBatchControl";
import { getAgiCertificationSnapshot, type AgiCertificationCheck } from "@/lib/agi-certification";
import { getHockerOperationalSnapshot, type OperationalStatus } from "@/lib/hocker-operational-state";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = { title: "AGIs | Hocker ONE", description: "Estado de las AGIs del ecosistema HOCKER.", robots: { index: false, follow: false, noarchive: true } };

function formatDate(value: string | null): string {
  if (!value) return "Sin actividad registrada";
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Tijuana" }).format(new Date(value));
}
function certificationId(value: string): string {
  return value.trim().toLowerCase().replaceAll("-", "_").replace(/^candy_ads$/, "candy").replace(/^nexpa_agi$/, "nexpa").replace(/^trackhok_agi$/, "trackhok");
}
function missingLabel(check: AgiCertificationCheck): string {
  switch (check) {
    case "canonical_profile": return "perfil";
    case "tools_ready": return "herramientas";
    case "tool_runtime_evidence": return "pruebas de herramientas";
    case "memory_ready": return "memoria";
    case "runtime_evidence": return "ejecución";
    case "allow_actions_guarded": return "aprobación";
    case "eval_contract_suite": return "prueba base";
    case "individual_eval_suite": return "prueba actual";
    default: return "evidencia";
  }
}
function visibleState(status: OperationalStatus, certified: boolean): { label: "Listo" | "Pendiente" | "Requiere atención"; className: string } {
  if (status === "degraded" || status === "offline") return { label: "Requiere atención", className: "bg-amber-300/10 text-amber-200" };
  if (certified) return { label: "Listo", className: "bg-emerald-300/10 text-emerald-200" };
  return { label: "Pendiente", className: "bg-white/[0.05] text-slate-300" };
}

export default async function AgisPage() {
  const [snapshot, certification] = await Promise.all([getHockerOperationalSnapshot(), getAgiCertificationSnapshot()]);
  const certificationById = new Map(certification.entries.map((entry) => [entry.agi_id, entry]));
  const attention = snapshot.agis.filter((agi) => agi.status === "degraded" || agi.status === "offline").length;

  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-5 pb-8">
      <header className="pt-2 sm:pt-4">
        <p className="text-sm font-semibold text-sky-300">AGIs</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white">Estado y revisión</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Ve qué está listo y qué necesita atención. El detalle técnico aparece sólo cuando lo abres.</p>
      </header>

      <section className="grid grid-cols-3 gap-2" aria-label="Resumen AGI">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3"><p className="text-xs text-slate-500">Total</p><strong className="mt-1 block text-2xl text-white">{snapshot.agis.length}</strong></div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3"><p className="text-xs text-slate-500">Listas</p><strong className="mt-1 block text-2xl text-white">{certification.certified}</strong></div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-3"><p className="text-xs text-slate-500">Atención</p><strong className="mt-1 block text-2xl text-white">{attention}</strong></div>
      </section>

      <section aria-label="Siguiente acción">
        <AgiEvalBatchControl
          agiIds={certification.entries.map((entry) => entry.agi_id)}
          runtimeEvalTargets={certification.runtime_eval_targets}
          toolEvalTargets={certification.tool_eval_targets}
          certificationSource={certification.source}
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#07101f]/72" aria-label="Lista de AGIs">
        {snapshot.agis.map((agi, index) => {
          const cert = certificationById.get(certificationId(agi.key));
          const state = visibleState(agi.status, Boolean(cert?.certified_for_current_scope));
          const pending = cert?.missing.map(missingLabel) ?? ["evidencia"];
          return (
            <details id={`agi-${cert?.agi_id ?? certificationId(agi.key)}`} key={agi.key} className={index === 0 ? "group" : "group border-t border-white/[0.055]"}>
              <summary className="flex min-h-[72px] cursor-pointer list-none items-center gap-3 px-3 py-3 sm:px-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.04] text-sky-200"><Bot className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1"><h2 className="truncate text-sm font-semibold text-white">{agi.title}</h2><p className="mt-0.5 truncate text-xs text-slate-500">{agi.role}</p></div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${state.className}`}>{state.label}</span>
                <ChevronDown className="h-4 w-4 shrink-0 text-slate-600 transition-transform group-open:rotate-180" />
              </summary>
              <div className="border-t border-white/[0.05] bg-black/10 px-4 py-4 sm:pl-[68px]">
                <p className="text-sm leading-6 text-slate-300">{agi.evidence}</p>
                {!cert?.certified_for_current_scope ? <div className="mt-3 flex items-start gap-2 text-xs text-amber-200"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>Pendiente: {pending.join(", ")}.</span></div> : <div className="mt-3 flex items-center gap-2 text-xs text-emerald-200"><CheckCircle2 className="h-4 w-4" />Pruebas vigentes para su alcance actual.</div>}
                <div className="mt-4 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                  <p className="flex items-center gap-2"><Clock3 className="h-3.5 w-3.5" />Actividad: {formatDate(agi.last_activity_at)}</p>
                  <p>Última ejecución: {agi.last_run_status ?? "Sin registro"}</p>
                  <p>Proceso: {agi.worker_id ?? "No identificado"}</p>
                  <p>Registro: {agi.registry_status ?? "Sin registro"}</p>
                </div>
              </div>
            </details>
          );
        })}
      </section>
      <span className="sr-only">En proceso</span>
    </div>
  );
}
