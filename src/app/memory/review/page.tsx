import type { Metadata } from "next";
import Link from "next/link";
import Hint from "@/components/Hint";
import MemoryReviewDecisionButtons from "@/components/MemoryReviewDecisionButtons";
import PageShell from "@/components/PageShell";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { getSyntiaMemoryReviewGatePublicContext } from "@/lib/syntia-memory-review-gate";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Review de Memoria · Hocker ONE",
  description: "Revisión owner de propuestas de memoria curada de SYNTIA.",
};

type LearningRow = {
  id: string;
  project_id: string;
  source_agi_id: string | null;
  source_agi_name: string | null;
  learning_title: string | null;
  learning_summary: string | null;
  status: string | null;
  update_type: string | null;
  source_type: string | null;
  risk_level: string | null;
  requires_owner_approval: boolean | null;
  canonical_memory_key: string | null;
  created_at: string;
};

function safeDate(input: string): string {
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("es-MX");
}

function statusClass(status: string | null): string {
  if (status === "pending_review") return "border-amber-400/25 bg-amber-500/10 text-amber-200";
  if (status === "approved") return "border-emerald-400/25 bg-emerald-500/10 text-emerald-200";
  if (status === "blocked") return "border-red-400/25 bg-red-500/10 text-red-200";
  if (status === "rejected") return "border-slate-400/25 bg-slate-500/10 text-slate-300";
  return "border-white/10 bg-white/5 text-slate-300";
}

function riskClass(risk: string | null): string {
  if (risk === "critical" || risk === "high") return "border-red-400/25 bg-red-500/10 text-red-200";
  if (risk === "medium") return "border-amber-400/25 bg-amber-500/10 text-amber-200";
  return "border-emerald-400/25 bg-emerald-500/10 text-emerald-200";
}

async function loadQueue(): Promise<LearningRow[]> {
  const sb = createAdminSupabase();

  const { data, error } = await sb
    .from("agi_learning_events")
    .select("id,project_id,source_agi_id,source_agi_name,learning_title,learning_summary,status,update_type,source_type,risk_level,requires_owner_approval,canonical_memory_key,created_at")
    .eq("project_id", "hocker-one")
    .in("status", ["pending_review", "approved", "rejected", "blocked"])
    .order("created_at", { ascending: false })
    .limit(80);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as LearningRow[];
}

export default async function MemoryReviewPage() {
  const rows = await loadQueue();
  const gate = getSyntiaMemoryReviewGatePublicContext();

  const pending = rows.filter((row) => row.status === "pending_review").length;
  const approved = rows.filter((row) => row.status === "approved").length;
  const rejected = rows.filter((row) => row.status === "rejected").length;
  const blocked = rows.filter((row) => row.status === "blocked").length;

  return (
    <PageShell
      title="Review de Memoria"
      subtitle="Owner Decision real para publicar memoria curada. Nada se publica si no pasa por aprobación owner."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link href="/memory" className="hocker-button-secondary">
            Memoria
          </Link>
          <Link href="/dashboard" className="hocker-button-primary">
            Panel
          </Link>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-amber-400">Pendientes</p>
            <p className="mt-1 text-2xl font-black text-white">{pending}</p>
          </div>
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Aprobadas</p>
            <p className="mt-1 text-2xl font-black text-white">{approved}</p>
          </div>
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Rechazadas</p>
            <p className="mt-1 text-2xl font-black text-white">{rejected}</p>
          </div>
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-red-400">Bloqueadas</p>
            <p className="mt-1 text-2xl font-black text-white">{blocked}</p>
          </div>
        </section>

        <Hint title="12.7H activo">
          Este módulo ignora reviewer_role enviado por body. La publicación en Memory Mirror solo ocurre con sesión owner real y queda auditada.
        </Hint>

        <section className="hocker-panel-pro p-5">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Contrato</p>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Versión</p>
              <p className="mt-1 text-sm font-black text-white">{gate.version}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Modo</p>
              <p className="mt-1 text-sm font-black text-white">{gate.mode}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Siguiente</p>
              <p className="mt-1 text-sm font-bold text-slate-300">{gate.next_step}</p>
            </div>
          </div>
        </section>

        <section className="hocker-panel-pro overflow-hidden">
          <div className="border-b border-white/5 p-5">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Cola</p>
            <h2 className="mt-1 text-lg font-black text-white">Propuestas de memoria</h2>
          </div>

          <div className="divide-y divide-white/5">
            {rows.map((row) => {
              const isPending = row.status === "pending_review";

              return (
                <article key={row.id} className="p-5">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="max-w-4xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${statusClass(row.status)}`}>
                          {row.status ?? "unknown"}
                        </span>
                        <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${riskClass(row.risk_level)}`}>
                          {row.risk_level ?? "risk"}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-slate-300">
                          {row.source_agi_name || row.source_agi_id || "AGI"}
                        </span>
                      </div>

                      <h3 className="mt-3 text-base font-black text-white">
                        {row.learning_title || "Propuesta sin título"}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        {row.learning_summary || "Sin resumen."}
                      </p>

                      <div className="mt-3 grid grid-cols-1 gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 md:grid-cols-2">
                        <p>Tipo: {row.update_type || "—"}</p>
                        <p>Fuente: {row.source_type || "—"}</p>
                        <p>Owner approval: {row.requires_owner_approval ? "sí" : "no"}</p>
                        <p>Fecha: {safeDate(row.created_at)}</p>
                      </div>

                      <p className="mt-3 break-all text-[10px] font-bold text-slate-600">
                        {row.canonical_memory_key || row.id}
                      </p>
                    </div>

                    <div className="w-full shrink-0 xl:w-[360px]">
                      <MemoryReviewDecisionButtons
                        learningEventId={row.id}
                        projectId={row.project_id}
                        disabled={!isPending}
                      />
                      {!isPending ? (
                        <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                          Esta propuesta ya fue procesada.
                        </p>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}

            {rows.length === 0 ? (
              <div className="p-5 text-sm text-slate-400">
                No hay propuestas de memoria para revisar.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
