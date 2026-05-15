"use client";

import {
  HOCKER_LIVE_OPERATION_NODES,
  getOperationStateLabel,
  getOperationStateTone,
  type HockerOperationNode,
} from "@/lib/hocker-live-operations-registry";

function envLabel(value: HockerOperationNode["environment"]): string {
  if (value === "production") return "Activo";
  if (value === "internal") return "Interno";
  return "Futuro";
}

function categoryLabel(value: string): string {
  const normalized = value.toLowerCase();
  if (normalized.includes("security")) return "Seguridad";
  if (normalized.includes("casino") || normalized.includes("chido")) return "Chido Casino";
  if (normalized.includes("wallet") || normalized.includes("finance")) return "Finanzas";
  if (normalized.includes("mobile")) return "App móvil";
  if (normalized.includes("core")) return "Núcleo";
  return value;
}

function OperationCard({ node }: { node: HockerOperationNode }) {
  return (
    <article className="rounded-[24px] border border-white/10 bg-[#0b1526] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-300">{categoryLabel(node.category)}</p>
          <h3 className="mt-2 text-xl font-black tracking-tight text-white">{node.name}</h3>
        </div>
        <span className={`rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${getOperationStateTone(node.state)}`}>{getOperationStateLabel(node.state)}</span>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-300">{node.executiveSummary}</p>
      <details className="mt-4 rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.035] px-4 py-3">
        <summary className="cursor-pointer text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">Siguiente paso</summary>
        <p className="mt-2 text-sm leading-6 text-slate-300">{node.safeNextAction}</p>
        <p className="mt-2 text-xs text-slate-500">Área: {envLabel(node.environment)}</p>
      </details>
    </article>
  );
}

export function LiveOperationsCenter() {
  return (
    <section className="hocker-panel-pro overflow-hidden p-5 sm:p-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-[10px] font-black uppercase tracking-[0.30em] text-cyan-300">Operación en vivo</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">Qué está pasando en el ecosistema.</h2>
          <p className="mt-4 text-base leading-7 text-slate-300">Vista simple de módulos centrales, estado y siguiente paso seguro. Los detalles técnicos quedan ocultos.</p>
        </div>
        <div className="rounded-[24px] border border-white/10 bg-white/[0.035] px-4 py-3 text-sm font-bold text-slate-300">{HOCKER_LIVE_OPERATION_NODES.length} módulos en seguimiento</div>
      </div>
      <div className="mt-6 grid gap-4 xl:grid-cols-2">{HOCKER_LIVE_OPERATION_NODES.map((node) => <OperationCard key={node.id} node={node} />)}</div>
    </section>
  );
}
