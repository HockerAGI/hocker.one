"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { humanRisk, humanStatus } from "./nova-chat-helpers";

type Review = {
  id: string; title: string; status: string; risk: string; operation: string;
  repository: string; branch: string; base: string; path: string; base_sha: string; file_sha: string;
  content: string | null; pr_title: string; pr_body: string; steps: string[]; rollback: string[]; fingerprint: string;
};
type Props = { projectId: string; actionId: string; onClose: () => void; onApproved: () => void };

export default function OwnerInlineActionReview({ projectId, actionId, onClose, onApproved }: Props) {
  const [review, setReview] = useState<Review | null>(null);
  const [allowed, setAllowed] = useState(false);
  const [ack, setAck] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [mfa, setMfa] = useState(false);
  const [notice, setNotice] = useState("");
  const [attempt, setAttempt] = useState(0);
  const lock = useRef(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const link = "/owner/actions?action_id=" + encodeURIComponent(actionId);
  const endpoint = "/api/agi/runtime/actions/decision";

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    async function load() {
      setLoading(true); setReview(null); setAllowed(false); setAck(false); setMfa(false); setNotice("");
      try {
        const query = new URLSearchParams({ project_id: projectId, action_id: actionId });
        const res = await fetch(endpoint + "?" + query, { cache: "no-store", signal: controller.signal });
        const data = await res.json().catch(() => ({}));
        if (!active) return;
        if (res.status === 403 && data.owner_gate_reason === "owner_mfa_required") {
          setMfa(true); throw new Error("Verifica tu identidad para revisar la acción.");
        }
        if (!res.ok || data.ok !== true || data.review?.id !== actionId || typeof data.review?.fingerprint !== "string") {
          throw new Error("No se pudo verificar esta acción. Consulta Aprobaciones.");
        }
        setReview(data.review);
        setAllowed(data.can_approve === true);
      } catch (error) {
        if (active) setNotice(error instanceof Error ? error.message : "No se pudo leer la acción.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; controller.abort(); };
  }, [projectId, actionId, attempt]);

  async function approve() {
    if (lock.current || busy || !review || !allowed || !ack || review.status !== "needs_approval") return;
    lock.current = true; setBusy(true); setNotice("");
    try {
      const res = await fetch(endpoint, {
        method: "POST", headers: { "content-type": "application/json" }, cache: "no-store",
        body: JSON.stringify({ project_id: projectId, action_id: actionId, decision: "approve",
          expected_review_fingerprint: review.fingerprint, note: "Aprobado tras revisión del contenido exacto en Hocker ONE." }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 403 && data.owner_gate_reason === "owner_mfa_required") setMfa(true);
      if (!res.ok || data.ok !== true || data.item?.id !== actionId || data.item?.status !== "approved") {
        throw new Error("No se confirmó la aprobación. Actualiza el estado antes de intentarlo de nuevo.");
      }
      setReview({ ...review, status: "approved" }); setNotice("Aprobada. Aún no se ha ejecutado.");
      onApproved();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Resultado no verificado. Consulta el estado.");
    } finally {
      setAllowed(false); setAck(false); setBusy(false); lock.current = false;
    }
  }

  return (
    <dialog ref={dialog} aria-label="Revisar acción" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}
      className="m-auto w-[min(94vw,760px)] max-h-[90dvh] overflow-y-auto rounded-2xl border border-slate-600 bg-[#101a29] p-0 text-slate-100 shadow-2xl backdrop:bg-black/75">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-700 bg-[#101a29] p-4 sm:p-5">
        <h2 className="text-xl font-semibold">Revisar acción</h2>
        <button type="button" disabled={busy} onClick={onClose} className="min-h-11 rounded-lg px-3 text-sm text-slate-200 hover:bg-white/10">Cerrar</button>
      </header>
      <div className="space-y-4 p-4 sm:p-5">
        {loading ? <p role="status">Consultando registro…</p> : null}
        {review ? <>
          <div><h3 className="break-words text-lg font-semibold">{review.title}</h3><p className="mt-1 text-sm text-slate-300">{humanStatus(review.status)} · Riesgo {humanRisk(review.risk)}</p></div>
          <dl className="grid gap-2 rounded-xl border border-slate-700 bg-[#0b1320] p-3 text-sm sm:grid-cols-2">
            {[["Repositorio", review.repository], ["Origen", review.base], ["Rama", review.branch], ["Archivo", review.path]].filter(([, value]) => value).map(([label,value]) => <div key={label}><dt className="text-slate-400">{label}</dt><dd className="break-all">{value}</dd></div>)}
          </dl>
          {review.content !== null ? <div><h4 className="mb-2 font-medium">Contenido propuesto del archivo</h4><pre tabIndex={0} className="max-h-[38dvh] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-slate-700 bg-[#080d15] p-3 text-xs leading-5">{review.content}</pre></div> : null}
          {review.pr_title ? <div><h4 className="font-medium">PR borrador: {review.pr_title}</h4><p className="mt-2 whitespace-pre-wrap break-words text-sm">{review.pr_body}</p></div> : null}
          <details className="rounded-xl border border-slate-700 p-3"><summary className="cursor-pointer font-medium">Evidencia y reversión</summary>
            <div className="mt-3 space-y-2 break-words text-sm text-slate-300">
              <p className="break-all">ID: {review.id}</p>
              {review.base_sha ? <p className="break-all">SHA de origen: {review.base_sha}</p> : null}
              {review.file_sha ? <p className="break-all">SHA del archivo: {review.file_sha}</p> : null}
              {review.steps.length ? <ul className="list-disc pl-5">{review.steps.map((step,i) => <li key={i}>{step}</li>)}</ul> : null}
              {review.rollback.length ? <ul className="list-disc pl-5">{review.rollback.map((step,i) => <li key={i}>{step}</li>)}</ul> : null}
            </div>
          </details>
          {allowed ? <label className="flex items-start gap-3 rounded-xl border border-amber-300/25 p-3 text-sm"><input type="checkbox" checked={ack} disabled={busy} onChange={event => setAck(event.target.checked)} className="mt-1 h-5 w-5 shrink-0" />He revisado el cambio exacto. Aprobar no ejecuta la acción.</label> : review.status === "needs_approval" && !notice ? <p className="text-sm text-amber-200">La aprobación real no está habilitada en esta vista de evaluación.</p> : null}
        </> : null}
        {notice ? <p role="status" className="rounded-xl border border-slate-600 p-3 text-sm">{notice}</p> : null}
        <div className="flex flex-wrap gap-2">
          {allowed ? <button type="button" disabled={!ack || busy} onClick={() => void approve()} className="min-h-11 rounded-xl bg-sky-300 px-4 text-sm font-semibold text-slate-950 disabled:opacity-40">{busy ? "Confirmando…" : "Confirmar aprobación"}</button> : null}
          {mfa ? <Link href={link} className="inline-flex min-h-11 items-center rounded-xl bg-sky-300 px-4 text-sm font-semibold text-slate-950">Verificar MFA</Link> : null}
          {!loading && !busy ? <button type="button" onClick={() => setAttempt(v => v + 1)} className="min-h-11 rounded-xl border border-slate-600 px-4 text-sm">Actualizar estado</button> : null}
          {!busy ? <Link href={link} className="inline-flex min-h-11 items-center px-3 text-sm text-sky-200">Centro de aprobación</Link> : null}
        </div>
      </div>
    </dialog>
  );
}
