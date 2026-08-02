import type { Metadata } from "next";
import Link from "next/link";
import { FileCheck2, RefreshCw, ShieldCheck } from "lucide-react";

import HockerPageHeader from "@/components/ui-hocker/HockerPageHeader";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { requirePrivateSession } from "@/lib/require-private-session";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Evidencia | Hocker ONE",
  description: "Registros persistidos de auditoría, cadena, ejecuciones y eventos.",
  robots: { index: false, follow: false, noarchive: true },
};

type AuditRow = {
  id: string;
  action: string;
  seq: number | null;
  row_hash: string | null;
  created_at: string;
};

type RunRow = {
  id: string;
  agi_id: string | null;
  tool_key: string | null;
  status: string | null;
  trace_id: string | null;
  result_hash: string | null;
  created_at: string;
  finished_at: string | null;
};

type EventRow = {
  id: string;
  level: string | null;
  type: string | null;
  message: string | null;
  created_at: string;
};

type EvidenceSummary = {
  ok: boolean;
  error: string | null;
  checkedAt: string;
  counts: {
    auditLogs: number;
    auditChain: number;
    runs: number;
    events: number;
  };
  auditLogs: AuditRow[];
  runs: RunRow[];
  events: EventRow[];
};

function shortHash(value: string | null) {
  if (!value) return "Sin hash";
  return value.length > 18 ? `${value.slice(0, 10)}…${value.slice(-6)}` : value;
}

function formatDate(value: string | null) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Tijuana",
  }).format(new Date(value));
}

async function loadEvidence(): Promise<EvidenceSummary> {
  const checkedAt = new Date().toISOString();
  try {
    const sb = createAdminSupabase();
    const [auditCount, chainCount, runCount, eventCount, auditRows, runs, events] = await Promise.all([
      sb.from("audit_logs").select("*", { count: "exact", head: true }).eq("project_id", "hocker-one"),
      sb.from("audit_chain").select("*", { count: "exact", head: true }).eq("project_id", "hocker-one"),
      sb.from("agi_runs").select("*", { count: "exact", head: true }).eq("project_id", "hocker-one"),
      sb.from("events").select("*", { count: "exact", head: true }).eq("project_id", "hocker-one"),
      sb.from("audit_logs").select("id,action,seq,row_hash,created_at").eq("project_id", "hocker-one").order("created_at", { ascending: false }).limit(20),
      sb.from("agi_runs").select("id,agi_id,tool_key,status,trace_id,result_hash,created_at,finished_at").eq("project_id", "hocker-one").order("created_at", { ascending: false }).limit(20),
      sb.from("events").select("id,level,type,message,created_at").eq("project_id", "hocker-one").order("created_at", { ascending: false }).limit(20),
    ]);
    const firstError = [
      auditCount.error,
      chainCount.error,
      runCount.error,
      eventCount.error,
      auditRows.error,
      runs.error,
      events.error,
    ].find(Boolean);

    return {
      ok: !firstError,
      error: firstError?.message ?? null,
      checkedAt,
      counts: {
        auditLogs: auditCount.count ?? 0,
        auditChain: chainCount.count ?? 0,
        runs: runCount.count ?? 0,
        events: eventCount.count ?? 0,
      },
      auditLogs: (auditRows.data ?? []) as AuditRow[],
      runs: (runs.data ?? []) as RunRow[],
      events: (events.data ?? []) as EventRow[],
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "No se pudo consultar la evidencia.",
      checkedAt,
      counts: { auditLogs: 0, auditChain: 0, runs: 0, events: 0 },
      auditLogs: [],
      runs: [],
      events: [],
    };
  }
}

export default async function OwnerEvidencePage() {
  await requirePrivateSession();
  const evidence = await loadEvidence();

  return (
    <div className="hko-page-flow space-y-5">
      <HockerPageHeader
        eyebrow="Auditoría persistida"
        title="Evidencia"
        text="Registros de auditoría, cadena de hashes, ejecuciones AGI y eventos obtenidos de Supabase. No se exponen payloads sensibles."
      />

      <section className="hko-map-panel">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="hko-kicker">Última lectura</p>
            <p className="mt-2 text-sm text-slate-300">{formatDate(evidence.checkedAt)}</p>
            <p className="mt-1 text-xs text-slate-500">Fuente: tablas `audit_logs`, `audit_chain`, `agi_runs` y `events`.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/owner/evidence" className="hko-action-secondary inline-flex items-center gap-2"><RefreshCw className="h-4 w-4" /> Actualizar</Link>
            <Link href="/commands" className="hko-action-primary">Ver aprobaciones</Link>
          </div>
        </div>
      </section>

      {!evidence.ok ? (
        <section className="rounded-2xl border border-rose-300/20 bg-rose-300/10 p-4 text-sm text-rose-100">
          La evidencia no pudo verificarse. Los contadores se muestran en cero y no deben interpretarse como ausencia confirmada. {evidence.error}
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="hko-mini-stat"><span>Audit logs</span><strong>{evidence.counts.auditLogs}</strong></article>
        <article className="hko-mini-stat"><span>Cadena de auditoría</span><strong>{evidence.counts.auditChain}</strong></article>
        <article className="hko-mini-stat"><span>Runs AGI</span><strong>{evidence.counts.runs}</strong></article>
        <article className="hko-mini-stat"><span>Eventos</span><strong>{evidence.counts.events}</strong></article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="hko-map-panel">
          <div className="mb-4 flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-cyan-200" /><h2 className="text-lg font-black text-white">Auditoría reciente</h2></div>
          <div className="space-y-3">
            {evidence.auditLogs.map((row) => (
              <div key={row.id} className="rounded-2xl border border-white/8 bg-slate-950/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-bold text-white">{row.action}</p>
                  <span className="text-xs text-slate-500">seq {row.seq ?? "—"}</span>
                </div>
                <p className="mt-2 text-xs text-slate-500">{formatDate(row.created_at)} · hash {shortHash(row.row_hash)}</p>
              </div>
            ))}
            {evidence.auditLogs.length === 0 ? <p className="text-sm text-slate-500">Sin registros de auditoría disponibles.</p> : null}
          </div>
        </article>

        <article className="hko-map-panel">
          <div className="mb-4 flex items-center gap-3"><FileCheck2 className="h-5 w-5 text-cyan-200" /><h2 className="text-lg font-black text-white">Runs recientes</h2></div>
          <div className="space-y-3">
            {evidence.runs.map((run) => (
              <div key={run.id} className="rounded-2xl border border-white/8 bg-slate-950/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-bold text-white">{run.agi_id ?? "AGI sin identificar"}</p>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-slate-300">{run.status ?? "sin estado"}</span>
                </div>
                <p className="mt-2 text-xs text-slate-500">Tool: {run.tool_key ?? "—"} · {formatDate(run.finished_at ?? run.created_at)}</p>
                <p className="mt-1 text-xs text-slate-600">Trace: {shortHash(run.trace_id)} · result: {shortHash(run.result_hash)}</p>
              </div>
            ))}
            {evidence.runs.length === 0 ? <p className="text-sm text-slate-500">Sin runs disponibles.</p> : null}
          </div>
        </article>
      </section>

      <section className="hko-map-panel">
        <p className="hko-kicker">Eventos recientes</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {evidence.events.map((event) => (
            <article key={event.id} className="rounded-2xl border border-white/8 bg-slate-950/40 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="font-bold text-white">{event.type ?? "Evento"}</p>
                <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{event.level ?? "info"}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-400">{event.message ?? "Sin mensaje."}</p>
              <p className="mt-2 text-xs text-slate-600">{formatDate(event.created_at)}</p>
            </article>
          ))}
          {evidence.events.length === 0 ? <p className="text-sm text-slate-500">Sin eventos disponibles.</p> : null}
        </div>
      </section>
    </div>
  );
}
