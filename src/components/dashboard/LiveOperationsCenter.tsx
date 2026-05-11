"use client";

import {
  HOCKER_LIVE_OPERATION_NODES,
  getOperationStateLabel,
  getOperationStateTone,
  type HockerOperationNode,
} from "@/lib/hocker-live-operations-registry";

function OperationCard({ node }: { node: HockerOperationNode }) {
  return (
    <article className="rounded-[28px] border border-white/10 bg-white/[0.035] p-5 shadow-[0_18px_80px_rgba(0,0,0,0.18)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-500">
            {node.category}
          </p>
          <h3 className="mt-2 text-xl font-black tracking-tight text-white">
            {node.name}
          </h3>
        </div>

        <span
          className={`rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${getOperationStateTone(node.state)}`}
        >
          {getOperationStateLabel(node.state)}
        </span>
      </div>

      <p className="mt-4 text-sm font-bold text-slate-300">{node.role}</p>

      <p className="mt-3 text-sm leading-6 text-slate-400">
        {node.executiveSummary}
      </p>

      <div className="mt-5 rounded-[20px] border border-cyan-300/10 bg-cyan-300/[0.035] p-4">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">
          Siguiente acción segura
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          {node.safeNextAction}
        </p>
      </div>
    </article>
  );
}

export function LiveOperationsCenter() {
  const productionNodes = HOCKER_LIVE_OPERATION_NODES.filter(
    (node) => node.environment === "production",
  );

  const internalNodes = HOCKER_LIVE_OPERATION_NODES.filter(
    (node) => node.environment === "internal",
  );

  const futureNodes = HOCKER_LIVE_OPERATION_NODES.filter(
    (node) => node.environment === "future",
  );

  return (
    <section className="rounded-[34px] border border-white/10 bg-[#07101f] p-5 shadow-[0_30px_120px_rgba(0,0,0,0.28)] sm:p-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-[10px] font-black uppercase tracking-[0.30em] text-cyan-300">
            Live Operations Center
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl">
            Mapa vivo del ecosistema HOCKER.
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-300">
            Vista ejecutiva de los módulos centrales, su estado operativo y la
            siguiente acción segura sin exponer comandos internos.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 rounded-[24px] border border-white/10 bg-white/[0.035] p-3 text-center">
          <div>
            <p className="text-2xl font-black text-white">
              {productionNodes.length}
            </p>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
              Producción
            </p>
          </div>
          <div>
            <p className="text-2xl font-black text-white">
              {internalNodes.length}
            </p>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
              Interno
            </p>
          </div>
          <div>
            <p className="text-2xl font-black text-white">
              {futureNodes.length}
            </p>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
              Futuro
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {HOCKER_LIVE_OPERATION_NODES.map((node) => (
          <OperationCard key={node.id} node={node} />
        ))}
      </div>
    </section>
  );
}
