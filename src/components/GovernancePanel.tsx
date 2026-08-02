"use client";

import { RefreshCw } from "lucide-react";
import { getErrorMessage } from "@/lib/errors";
import { useWorkspace } from "@/components/WorkspaceContext";
import type { ControlRow } from "@/lib/types";
import { useCallback, useEffect, useState } from "react";

function formatDate(value: string | null | undefined): string {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Fecha inválida" : date.toLocaleString("es-MX");
}

export default function GovernancePanel() {
  const { projectId } = useWorkspace();
  const [controls, setControls] = useState<ControlRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/governance/killswitch?project_id=${encodeURIComponent(projectId)}`, { cache: "no-store" });
      const data: unknown = await response.json().catch(() => ({}));
      if (!response.ok) {
        const body = data && typeof data === "object" ? data as Record<string, unknown> : null;
        throw new Error(typeof body?.error === "string" ? body.error : "No se pudo leer el control de gobierno.");
      }
      const body = data && typeof data === "object" ? data as Record<string, unknown> : null;
      const nextControls = body?.controls as ControlRow | undefined;
      if (!nextControls) throw new Error("La API respondió sin un registro de control verificable.");
      setControls(nextControls);
      setCheckedAt(new Date().toISOString());
    } catch (loadError: unknown) {
      setControls(null);
      setCheckedAt(new Date().toISOString());
      setError(getErrorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    queueMicrotask(() => { void load(); });
    const timer = window.setInterval(() => { void load(); }, 30_000);
    return () => window.clearInterval(timer);
  }, [load]);

  async function toggle(field: "kill_switch" | "allow_write"): Promise<void> {
    if (!controls || saving) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        project_id: projectId,
        kill_switch: field === "kill_switch" ? !controls.kill_switch : controls.kill_switch,
        allow_write: field === "allow_write" ? !controls.allow_write : controls.allow_write,
      };
      const response = await fetch("/api/governance/killswitch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: unknown = await response.json().catch(() => ({}));
      if (!response.ok) {
        const body = data && typeof data === "object" ? data as Record<string, unknown> : null;
        throw new Error(typeof body?.error === "string" ? body.error : "No se pudo actualizar el control.");
      }
      const body = data && typeof data === "object" ? data as Record<string, unknown> : null;
      const nextControls = body?.controls as ControlRow | undefined;
      if (!nextControls) throw new Error("La API confirmó el cambio sin devolver el registro actualizado.");
      setControls(nextControls);
      setCheckedAt(new Date().toISOString());
    } catch (saveError: unknown) {
      setError(getErrorMessage(saveError));
      await load();
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="hocker-panel-pro overflow-hidden border-rose-500/20 shadow-[0_0_40px_rgba(225,29,72,0.08)]">
      <div className="border-b border-white/5 bg-slate-950/45 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-rose-300">Seguridad</p>
            <h3 className="mt-2 text-lg font-black text-white sm:text-xl">Registro de control</h3>
          </div>
          <button type="button" onClick={() => void load()} disabled={loading || saving} className="hko-action-secondary inline-flex items-center gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Actualizar
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-500">Consulta: {formatDate(checkedAt)} · Registro: {formatDate(controls?.updated_at)}</p>
      </div>

      <div className="p-4 sm:p-6">
        {loading && !controls ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="animate-pulse rounded-[28px] border border-white/5 bg-slate-950/50 p-6">
                <div className="h-4 w-28 rounded-full bg-slate-800" />
                <div className="mt-4 h-10 w-20 rounded-full bg-slate-800" />
              </div>
            ))}
          </div>
        ) : null}

        {!loading && !controls ? (
          <div className="rounded-[24px] border border-rose-500/20 bg-rose-500/10 p-5 text-sm leading-6 text-rose-100">
            <p className="font-black">Estado no verificado</p>
            <p className="mt-2">{error ?? "No se obtuvo un registro de gobierno."}</p>
            <p className="mt-2 text-xs text-rose-200/70">No se asume operación normal ni escritura bloqueada hasta recuperar la lectura.</p>
          </div>
        ) : null}

        {controls ? (
          <>
            {error ? <div className="mb-4 rounded-[20px] border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">{error}</div> : null}
            <div className="grid gap-4 md:grid-cols-2">
              <div className={`relative overflow-hidden rounded-[28px] border p-6 ${controls.kill_switch ? "border-rose-500/40 bg-rose-950/20" : "border-white/5 bg-slate-950/60"}`}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-[14px] font-black uppercase tracking-wide text-white">Pausa total</h4>
                    <p className="mt-1 text-[11px] text-slate-400">Valor persistido: {String(controls.kill_switch)}</p>
                  </div>
                  <button type="button" aria-pressed={controls.kill_switch} onClick={() => void toggle("kill_switch")} disabled={loading || saving} className={`relative inline-flex h-10 w-20 items-center rounded-full transition-all disabled:opacity-50 ${controls.kill_switch ? "bg-rose-600" : "border border-white/10 bg-slate-800"}`}>
                    <span className={`inline-block h-8 w-8 rounded-full bg-white transition-transform ${controls.kill_switch ? "translate-x-11" : "translate-x-1"}`} />
                  </button>
                </div>
                <span className={`mt-5 inline-flex rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] ${controls.kill_switch ? "border-rose-400/40 bg-rose-500/20 text-rose-300" : "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"}`}>
                  {controls.kill_switch ? "Pausa habilitada" : "Pausa deshabilitada"}
                </span>
              </div>

              <div className={`relative overflow-hidden rounded-[28px] border p-6 ${controls.allow_write ? "border-amber-400/30 bg-amber-950/10" : "border-emerald-400/20 bg-emerald-950/10"}`}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-[14px] font-black uppercase tracking-wide text-white">Permiso de escritura</h4>
                    <p className="mt-1 text-[11px] text-slate-400">Valor persistido: {String(controls.allow_write)}</p>
                  </div>
                  <button type="button" aria-pressed={controls.allow_write} onClick={() => void toggle("allow_write")} disabled={loading || saving} className={`relative inline-flex h-10 w-20 items-center rounded-full transition-all disabled:opacity-50 ${controls.allow_write ? "bg-amber-500" : "border border-white/10 bg-slate-800"}`}>
                    <span className={`inline-block h-8 w-8 rounded-full bg-white transition-transform ${controls.allow_write ? "translate-x-11" : "translate-x-1"}`} />
                  </button>
                </div>
                <span className={`mt-5 inline-flex rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] ${controls.allow_write ? "border-amber-400/30 bg-amber-400/10 text-amber-200" : "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"}`}>
                  {controls.allow_write ? "Escritura permitida" : "Escritura bloqueada"}
                </span>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
