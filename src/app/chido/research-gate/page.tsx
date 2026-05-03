import type { Metadata } from "next";
import Link from "next/link";
import Hint from "@/components/Hint";
import PageShell from "@/components/PageShell";
import {
  AGI_RESEARCH_GATE_RULES,
  AGI_RESEARCH_GATE_SOURCES,
  AGI_RESEARCH_GATE_VERSION,
  CHIDO_RESEARCH_GATE_MATRIX,
} from "@/lib/agi-research-gate";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Research Gate · Chido Casino",
  description: "Fuentes, reglas y guardianes para acciones críticas del ecosistema HOCKER.",
};

export default function ChidoResearchGatePage() {
  return (
    <PageShell
      title="Research Gate"
      subtitle="Capa obligatoria de fuentes, validación, auditoría y guardianes para Chido Casino y todas las AGIs."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link href="/chido/actions" className="hocker-button-secondary">Acciones</Link>
          <Link href="/chido/ops" className="hocker-button-secondary">Operación</Link>
          <Link href="/chido" className="hocker-button-primary">Chido</Link>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <Hint title="Research Gate obligatorio">
          Ninguna acción sensible puede pasar de dry-run a ejecución real sin fuente oficial, auditoría, aprobación explícita, HMAC y guardianes activos.
        </Hint>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Versión</p>
            <p className="mt-1 text-sm font-black text-white">{AGI_RESEARCH_GATE_VERSION}</p>
          </div>
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Fuentes</p>
            <p className="mt-1 text-2xl font-black text-white">{AGI_RESEARCH_GATE_SOURCES.length}</p>
          </div>
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Reglas</p>
            <p className="mt-1 text-2xl font-black text-white">{AGI_RESEARCH_GATE_RULES.length}</p>
          </div>
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Estado</p>
            <p className="mt-1 text-sm font-black text-amber-300">Dry-run only</p>
          </div>
        </section>

        <section className="hocker-panel-pro overflow-hidden">
          <div className="border-b border-white/5 p-5">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Fuentes</p>
            <h2 className="mt-1 text-lg font-black text-white">Fuentes oficiales / primarias</h2>
          </div>

          <div className="grid grid-cols-1 gap-3 p-5 lg:grid-cols-2">
            {AGI_RESEARCH_GATE_SOURCES.map((source) => (
              <article key={source.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-cyan-300">{source.authority}</p>
                <h3 className="mt-1 text-base font-black text-white">{source.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">{source.gateRule}</p>
                <p className="mt-3 break-all text-xs text-slate-500">{source.url}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {source.appliesTo.map((agi) => (
                    <span key={agi} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-slate-300">
                      {agi}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="hocker-panel-pro overflow-hidden">
          <div className="border-b border-white/5 p-5">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Reglas</p>
            <h2 className="mt-1 text-lg font-black text-white">Reglas obligatorias</h2>
          </div>

          <div className="grid grid-cols-1 gap-3 p-5 lg:grid-cols-2">
            {AGI_RESEARCH_GATE_RULES.map((rule) => (
              <article key={rule.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-[9px] font-black uppercase tracking-widest text-amber-300">{rule.id}</p>
                <h3 className="mt-1 text-base font-black text-white">{rule.label}</h3>

                <div className="mt-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Guardianes</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {rule.guardianAgis.map((agi) => (
                      <span key={agi} className="rounded-lg border border-cyan-400/10 bg-cyan-500/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-cyan-200">
                        {agi}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Evidencia</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {rule.requiredEvidence.map((item) => (
                      <span key={item} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-slate-300">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="hocker-panel-pro overflow-hidden">
          <div className="border-b border-white/5 p-5">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Chido Matrix</p>
            <h2 className="mt-1 text-lg font-black text-white">Matriz por área</h2>
          </div>

          <div className="divide-y divide-white/5">
            {CHIDO_RESEARCH_GATE_MATRIX.map((item) => (
              <article key={item.area} className="p-5">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-cyan-300">{item.area}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">Estado: {item.status}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.guardianAgis.map((agi) => (
                      <span key={agi} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-slate-300">
                        {agi}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
