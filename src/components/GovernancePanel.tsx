"use client";

import { getErrorMessage } from "@/lib/errors";
import { useWorkspace } from "@/components/WorkspaceContext";
import type { ControlRow } from "@/lib/types";
import { useCallback, useEffect, useState } from "react";

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("es-MX");
}

export default function GovernancePanel() {
  const { projectId } = useWorkspace();
  const [controls, setControls] = useState<ControlRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/governance/killswitch?project_id=${encodeURIComponent(projectId)}`,
        { cache: "no-store" },
      );
      const data: unknown = await res.json();

      if (!res.ok) {
        const body = data && typeof data === "object" ? (data as Record<string, unknown>) : null;
        throw new Error(
          typeof body?.error === "string" ? body.error : "No se pudo leer la seguridad.",
        );
      }

      const body = data && typeof data === "object" ? (data as Record<string, unknown>) : null;
      setControls((body?.controls as ControlRow) ?? null);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      setControls(null);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggle(field: "kill_switch" | "allow_write"): Promise<void> {
    if (!controls) return;

    setSaving(true);
    setError(null);

    try {
      const payload = {
        project_id: projectId,
        kill_switch: field === "kill_switch" ? !controls.kill_switch : controls.kill_switch,
        allow_write: field === "allow_write" ? !controls.allow_write : controls.allow_write,
      };

      const res = await fetch("/api/governance/killswitch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data: unknown = await res.json();
      if (!res.ok) {
        const body = data && typeof data === "object" ? (data as Record<string, unknown>) : null;
        throw new Error(
          typeof body?.error === "string" ? body.error : "No se pudo actualizar.",
        );
      }

      const body = data && typeof data === "object" ? (data as Record<string, unknown>) : null;
      setControls((body?.controls as ControlRow) ?? null);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  const lastUpdate = formatDate(controls?.updated_at);

  return (
    <section className="hocker-panel-pro overflow-hidden border-rose-500/20 shadow-[0_0_40px_rgba(225,29,72,0.08)]">
      <div className="border-b border-white/5 bg-slate-950/45 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-rose-300">
              Seguridad
            </p>
            <h3 className="mt-2 text-lg font-black text-white sm:text-xl">
              Control principal
            </h3>
          </div>

          <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[9px] font-black uppercase tracking-widest text-slate-300">
            {lastUpdate}
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        {error ? (
          <div className="mb-4 rounded-[24px] border border-rose-500/20 bg-rose-500/10 p-4 text-[11px] leading-relaxed text-rose-200">
            {error}
          </div>
        ) : null}

        {loading && !controls ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <div
                key={index}
                className="animate-pulse rounded-[28px] border border-white/5 bg-slate-950/50 p-6"
              >
                <div className="h-4 w-28 rounded-full bg-slate-800" />
                <div className="mt-4 h-10 w-20 rounded-full bg-slate-800" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <div
              className={`relative overflow-hidden rounded-[28px] border p-6 transition-all duration-500 ${
                controls?.kill_switch
                  ? "border-rose-500/40 bg-rose-950/20 shadow-[0_0_40px_rgba(225,29,72,0.08)]"
                  : "border-white/5 bg-slate-950/60 hover:border-rose-500/20"
              }`}
            >
              <div className="relative z-10 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-[14px] font-black uppercase tracking-wide text-white">
                    Pausa total
                  </h4>
                  <p className="mt-1 text-[11px] font-medium text-slate-400">
                    Detiene toda escritura y ejecución.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void toggle("kill_switch")}
                  disabled={loading || saving}
                  className={`relative inline-flex h-10 w-20 items-center rounded-full transition-all focus:outline-none disabled:opacity-50 ${
                    controls?.kill_switch
                      ? "bg-rose-600 shadow-[0_0_25px_rgba(225,29,72,0.8)]"
                      : "border border-white/10 bg-slate-800"
                  }`}
                >
                  <span
                    className={`inline-block h-8 w-8 transform rounded-full bg-white transition-all shadow-md ${
                      controls?.kill_switch ? "translate-x-11" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div
                className={`relative z-10 mt-5 inline-flex rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] shadow-inner ${
                  controls?.kill_switch
                    ? "border-rose-400/40 bg-rose-500/20 text-rose-300"
                    : "border-white/10 bg-white/5 text-slate-500"
                }`}
              >
                {controls?.kill_switch ? "Todo detenido" : "Operación normal"}
              </div>
            </div>

            <div
              className={`relative overflow-hidden rounded-[28px] border p-6 transition-all duration-500 ${
                controls?.allow_write
                  ? "border-emerald-500/30 bg-emerald-950/10 shadow-[0_0_40px_rgba(16,185,129,0.08)]"
                  : "border-white/5 bg-slate-950/60 hover:border-emerald-500/20"
              }`}
            >
              <div className="relative z-10 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-[14px] font-black uppercase tracking-wide text-white">
                    Permitir cambios
                  </h4>
                  <p className="mt-1 text-[11px] font-medium text-slate-400">
                    Autoriza nuevas escrituras en el sistema.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void toggle("allow_write")}
                  disabled={loading || saving}
                  className={`relative inline-flex h-10 w-20 items-center rounded-full transition-all focus:outline-none disabled:opacity-50 ${
                    controls?.allow_write
                      ? "bg-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.7)]"
                      : "border border-white/10 bg-slate-800"
                  }`}
                >
                  <span
                    className={`inline-block h-8 w-8 transform rounded-full bg-white transition-all shadow-md ${
                      controls?.allow_write ? "translate-x-11" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div
                className={`relative z-10 mt-5 inline-flex rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] shadow-inner ${
                  controls?.allow_write
                    ? "border-emerald-400/40 bg-emerald-500/20 text-emerald-300"
                    : "border-white/10 bg-white/5 text-slate-500"
                }`}
              >
                {controls?.allow_write ? "Cambios activos" : "Escritura pausada"}
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 rounded-[24px] border border-white/5 bg-white/[0.03] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-500">
            Estado
          </p>
          <p className="mt-2 text-sm text-slate-300">
            {controls
              ? "El panel ya leyó el estado actual del sistema."
              : "Aún no se pudo leer el estado actual."}
          </p>
        </div>
      </div>
    </section>
  );
}