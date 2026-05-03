import type { Metadata } from "next";
import Link from "next/link";
import Hint from "@/components/Hint";
import PageShell from "@/components/PageShell";
import {
  CHIDO_ACTION_CONTRACT_VERSION,
  CHIDO_ACTIONS_CONTRACT,
  CHIDO_PERMANENTLY_BLOCKED_ACTIONS,
} from "@/lib/chido-actions";
import DryRunPanel from "./DryRunPanel";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Acciones Chido · Hocker ONE",
  description: "Contrato de acciones controladas de Chido Casino en modo dry-run.",
};

function riskClass(risk: string): string {
  if (risk === "critical") return "border-rose-400/20 bg-rose-500/10 text-rose-300";
  if (risk === "high") return "border-amber-400/20 bg-amber-500/10 text-amber-300";
  if (risk === "medium") return "border-cyan-400/20 bg-cyan-500/10 text-cyan-300";
  return "border-emerald-400/20 bg-emerald-500/10 text-emerald-300";
}

export default function ChidoActionsPage() {
  return (
    <PageShell
      title="Acciones Chido"
      subtitle="Contrato de acciones controladas en modo dry-run. Ninguna acción real está habilitada."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link href="/chido" className="hocker-button-secondary">Chido</Link>
          <Link href="/chido/ops" className="hocker-button-secondary">Operación</Link>
          <Link href="/dashboard" className="hocker-button-primary">Panel</Link>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <Hint title="Bloqueo real activo">
          Esta capa solo registra intención y auditoría. La ejecución real exige HMAC, aprobación explícita, guardianes activos y bitácora completa. Por ahora todo queda bloqueado.
        </Hint>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Contrato</p>
            <p className="mt-1 text-sm font-black text-white">{CHIDO_ACTION_CONTRACT_VERSION}</p>
          </div>

          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Acciones dry-run</p>
            <p className="mt-1 text-2xl font-black text-white">{CHIDO_ACTIONS_CONTRACT.length}</p>
          </div>

          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Ejecución real</p>
            <p className="mt-1 text-sm font-black text-rose-300">Bloqueada</p>
          </div>

          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Acciones prohibidas</p>
            <p className="mt-1 text-2xl font-black text-white">{CHIDO_PERMANENTLY_BLOCKED_ACTIONS.length}</p>
          </div>
        </section>

        <DryRunPanel actions={CHIDO_ACTIONS_CONTRACT} />

        <section className="hocker-panel-pro overflow-hidden">
          <div className="border-b border-white/5 p-5">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Contrato</p>
            <h2 className="mt-1 text-lg font-black text-white">Acciones controladas disponibles para dry-run</h2>
          </div>

          <div className="grid grid-cols-1 gap-3 p-5 lg:grid-cols-2">
            {CHIDO_ACTIONS_CONTRACT.map((action) => (
              <article key={action.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{action.id}</p>
                    <h3 className="mt-1 text-base font-black text-white">{action.label}</h3>
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${riskClass(action.riskLevel)}`}>
                    {action.riskLevel}
                  </span>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-300">{action.description}</p>

                <div className="mt-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Guardianes</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {action.guardianAgis.map((agi) => (
                      <span key={agi} className="rounded-lg border border-cyan-400/10 bg-cyan-500/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-cyan-200">
                        {agi}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Antes de ejecución real</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {action.requiredBeforeRealExecution.map((item) => (
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
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Bloqueo permanente</p>
            <h2 className="mt-1 text-lg font-black text-white">Acciones no permitidas</h2>
          </div>

          <div className="divide-y divide-white/5">
            {CHIDO_PERMANENTLY_BLOCKED_ACTIONS.map((action) => (
              <article key={action.id} className="p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-rose-300">{action.id}</p>
                <h3 className="mt-1 text-base font-black text-white">{action.label}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{action.reason}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
