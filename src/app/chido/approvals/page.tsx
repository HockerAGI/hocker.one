import type { Metadata } from "next";
import Link from "next/link";
import Hint from "@/components/Hint";
import PageShell from "@/components/PageShell";
import { createAdminSupabase } from "@/lib/supabase-admin";
import type { JsonObject } from "@/lib/types";
import { CHIDO_ACTIONS_CONTRACT } from "@/lib/chido-actions";
import {
  CHIDO_APPROVAL_EVENTS,
  CHIDO_APPROVAL_LAYER_VERSION,
  chidoApprovalStatusFromDates,
  type ChidoApprovalStatus,
} from "@/lib/chido-approvals";
import ApprovalRequestPanel from "./ApprovalRequestPanel";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Aprobaciones Chido · Hocker ONE",
  description: "Approval Layer interno para Chido Actions en modo auditado sin ejecución real.",
};

type EventRow = {
  id: string;
  type: string;
  message: string | null;
  created_at: string;
  data: JsonObject | null;
};

function asRecord(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonObject) : {};
}

function asText(value: unknown, fallback = "—"): string {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text ? text : fallback;
}

function safeDate(value: unknown): string {
  const text = asText(value, "");
  if (!text) return "—";
  const d = new Date(text);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("es-MX");
}

function statusClass(status: string): string {
  if (status === "approved") return "border-emerald-400/20 bg-emerald-500/10 text-emerald-300";
  if (status === "rejected") return "border-rose-400/20 bg-rose-500/10 text-rose-300";
  if (status === "expired") return "border-slate-400/20 bg-slate-500/10 text-slate-300";
  return "border-amber-400/20 bg-amber-500/10 text-amber-300";
}

async function loadApprovals() {
  const sb = createAdminSupabase();

  const { data } = await sb
    .from("events")
    .select("id,type,message,created_at,data")
    .eq("project_id", "chido-casino")
    .like("type", "chido.action.approval_%")
    .order("created_at", { ascending: false })
    .limit(80);

  const events = (data ?? []) as EventRow[];

  const decisions = new Map<string, EventRow>();

  for (const event of events) {
    if (event.type !== CHIDO_APPROVAL_EVENTS.decision) continue;

    const d = asRecord(event.data);
    const requestId = asText(d.approval_request_id, "");

    if (requestId && !decisions.has(requestId)) {
      decisions.set(requestId, event);
    }
  }

  const requests = events
    .filter((event) => event.type === CHIDO_APPROVAL_EVENTS.request)
    .map((event) => {
      const requestData = asRecord(event.data);
      const approvalRequestId = asText(requestData.approval_request_id, "");
      const decision = approvalRequestId ? decisions.get(approvalRequestId) : undefined;
      const decisionData = asRecord(decision?.data);

      const baseStatus = asText(requestData.status, "pending") as ChidoApprovalStatus;
      const status = decision
        ? (asText(decisionData.decision, "pending") as ChidoApprovalStatus)
        : chidoApprovalStatusFromDates(baseStatus, asText(requestData.expires_at, ""));

      return {
        event,
        data: requestData,
        decision,
        decisionData,
        status,
      };
    });

  return {
    requests,
    decisionsCount: events.filter((event) => event.type === CHIDO_APPROVAL_EVENTS.decision).length,
  };
}

export default async function ChidoApprovalsPage() {
  const { requests, decisionsCount } = await loadApprovals();

  const pending = requests.filter((item) => item.status === "pending").length;
  const approved = requests.filter((item) => item.status === "approved").length;
  const rejected = requests.filter((item) => item.status === "rejected").length;
  const expired = requests.filter((item) => item.status === "expired").length;

  return (
    <PageShell
      title="Aprobaciones Chido"
      subtitle="Approval Layer interno para Chido Actions. Aprobación auditada sin ejecución real."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link href="/chido/actions" className="hocker-button-secondary">Acciones</Link>
          <Link href="/chido/research-gate" className="hocker-button-secondary">Research Gate</Link>
          <Link href="/chido" className="hocker-button-primary">Chido</Link>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <Hint title="Ejecución real bloqueada">
          Una aprobación interna no ejecuta acciones reales. Solo registra intención, guardianes, decisión y auditoría. La ejecución real sigue bloqueada hasta HMAC y validaciones adicionales.
        </Hint>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Versión</p>
            <p className="mt-1 text-xs font-black text-white">{CHIDO_APPROVAL_LAYER_VERSION}</p>
          </div>
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Pendientes</p>
            <p className="mt-1 text-2xl font-black text-white">{pending}</p>
          </div>
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Aprobadas</p>
            <p className="mt-1 text-2xl font-black text-white">{approved}</p>
          </div>
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Rechazadas</p>
            <p className="mt-1 text-2xl font-black text-white">{rejected}</p>
          </div>
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Expiradas</p>
            <p className="mt-1 text-2xl font-black text-white">{expired}</p>
          </div>
        </section>

        <ApprovalRequestPanel actions={CHIDO_ACTIONS_CONTRACT} />

        <section className="hocker-panel-pro overflow-hidden">
          <div className="border-b border-white/5 p-5">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Solicitudes</p>
            <h2 className="mt-1 text-lg font-black text-white">Aprobaciones recientes</h2>
          </div>

          <div className="divide-y divide-white/5">
            {requests.map((item) => {
              const approvalId = asText(item.data.approval_request_id);
              const actionId = asText(item.data.action_id);
              const actionLabel = asText(item.data.action_label);
              const status = item.status;

              return (
                <article key={approvalId} className="p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-cyan-300">{actionId}</p>
                      <h3 className="mt-1 text-base font-black text-white">{actionLabel}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        {asText(item.data.reason, "Sin razón registrada.")}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">ID: {approvalId}</p>
                    </div>

                    <span className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusClass(status)}`}>
                      {status}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Solicitado por</p>
                      <p className="mt-1 text-xs font-bold text-white">{asText(item.data.requested_by)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Objetivo</p>
                      <p className="mt-1 text-xs font-bold text-white">{asText(item.data.target_id_preview)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Expira</p>
                      <p className="mt-1 text-xs font-bold text-white">{safeDate(item.data.expires_at)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Decisión</p>
                      <p className="mt-1 text-xs font-bold text-white">
                        {item.decision ? `${asText(item.decisionData.guardian_agi)} · ${safeDate(item.decision.created_at)}` : "—"}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}

            {requests.length === 0 ? (
              <div className="p-5 text-sm text-slate-400">
                Todavía no hay solicitudes de aprobación.
              </div>
            ) : null}
          </div>
        </section>

        <section className="hocker-panel-pro p-5">
          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Decisiones</p>
          <p className="mt-1 text-lg font-black text-white">{decisionsCount} decisiones registradas</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Las decisiones solo desbloquean revisión interna. La ejecución real sigue bloqueada.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
