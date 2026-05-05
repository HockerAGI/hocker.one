import type { Metadata } from "next";
import Link from "next/link";
import Hint from "@/components/Hint";
import PageShell from "@/components/PageShell";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Launch Readiness · Hocker ONE",
  description: "Checklist operativo de lanzamiento beta para Hocker ONE.",
};

const blocks = [
  ["Core operativo", "ready", ["Dashboard", "Global Health Center", "Integration Registry", "Access Policy", "SYNTIA Memory"]],
  ["Chido Canonical Module", "ready", ["Read-only", "Dry-run", "Approval Layer", "HMAC Signature Layer", "Execution Preflight"]],
  ["Seguridad", "locked", ["real_execution_enabled=false", "execution_lock=true", "roles minimos", "audit events"]],
  ["Documentacion", "ready", ["Launch Checklist", "Operator Manual", "Integration Contract"]],
] as const;

function statusClass(status: string): string {
  if (status === "ready") return "border-emerald-400/20 bg-emerald-500/10 text-emerald-300";
  if (status === "locked") return "border-rose-400/20 bg-rose-500/10 text-rose-300";
  return "border-slate-400/20 bg-slate-500/10 text-slate-300";
}

export default function LaunchPage() {
  return (
    <PageShell
      title="Launch Readiness"
      subtitle="Estado ejecutivo para lanzar Hocker ONE como beta operativa privada."
      actions={<div className="flex flex-wrap gap-2"><Link href="/status" className="hocker-button-secondary">Status</Link><Link href="/integrations" className="hocker-button-secondary">Integraciones</Link><Link href="/access" className="hocker-button-secondary">Access</Link><Link href="/dashboard" className="hocker-button-primary">Dashboard</Link></div>}
    >
      <div className="flex flex-col gap-6">
        <Hint title="Estado de lanzamiento">Hocker ONE esta orientado a beta operativa privada. Puede monitorear, auditar, integrar y validar flujos, pero mantiene toda ejecucion real bloqueada.</Hint>
        <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="hocker-panel-pro p-4"><p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Launch mode</p><p className="mt-1 text-sm font-black text-emerald-300">beta privada</p></div>
          <div className="hocker-panel-pro p-4"><p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Core readiness</p><p className="mt-1 text-3xl font-black text-emerald-300">alto</p></div>
          <div className="hocker-panel-pro p-4"><p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Real execution</p><p className="mt-1 text-sm font-black text-rose-300">bloqueada</p></div>
          <div className="hocker-panel-pro p-4"><p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Next phase</p><p className="mt-1 text-sm font-black text-white">1E</p></div>
        </section>
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">{blocks.map(([title,status,items]) => (<article key={title} className="hocker-panel-pro overflow-hidden"><div className="border-b border-white/5 p-5"><div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between"><h2 className="text-lg font-black text-white">{title}</h2><span className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusClass(status)}`}>{status}</span></div></div><div className="p-5"><div className="flex flex-wrap gap-2">{items.map((item) => (<span key={item} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-slate-300">{item}</span>))}</div></div></article>))}</section>
        <section className="hocker-panel-pro p-5"><p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Regla principal</p><h2 className="mt-1 text-xl font-black text-white">Beta si. Ejecucion real todavia no.</h2><p className="mt-3 text-sm leading-6 text-slate-400">Hocker ONE ya puede operar como centro de control beta. Las acciones sensibles siguen bloqueadas hasta definir Execution Policy, ledger, rollback, limites y doble confirmacion humana.</p></section>
      </div>
    </PageShell>
  );
}
