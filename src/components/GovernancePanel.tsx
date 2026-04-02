"use client";

import { getErrorMessage } from "@/lib/errors";
import { useWorkspace } from "@/components/WorkspaceContext";
import type { ControlRow } from "@/lib/types";
import { useEffect, useState } from "react";

export default function GovernancePanel() {
  const { projectId } = useWorkspace();
  const [controls, setControls] = useState<ControlRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/governance/killswitch?project_id=${encodeURIComponent(projectId)}`, {
        cache: "no-store",
      });
      const data: unknown = await res.json();

      if (!res.ok) {
        const body = data && typeof data === "object" ? (data as Record<string, unknown>) : null;
        throw new Error(
          typeof body?.error === "string" ? body.error : "Error al cargar protocolos.",
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
  }

  useEffect(() => {
    void load();
  }, [projectId]);

  async function toggle(field: "kill_switch" | "allow_write") {
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
          typeof body?.error === "string" ? body.error : "Falla al actualizar protocolo.",
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

  const lastUpdate =
    controls?.updated_at && !Number.isNaN(new Date(controls.updated_at).getTime())
      ? new Date(controls.updated_at).toLocaleString()
      : "—";

  return (
    <section className="hocker-panel-pro overflow-hidden border-rose-500/20 shadow-[0_0_40px_rgba(225,29,72,0.05)]">
      <div className="flex items-center justify-between border-b border-rose-500/10 bg-gradient-to-r from-rose-500/10 to-transparent p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-500">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-rose-500">
            Control de autoridad
          </h3>
        </div>

        {saving ? (
          <div className="flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full animate-pulse bg-rose-500" />
            <span className="text-[9px] font-black uppercase tracking-widest text-rose-400">
              Guardando
            </span>
          </div>
        ) : null}
      </div>

      <div className="p-6 sm:p-8">
        {error ? (
          <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-[11px] font-bold uppercase tracking-wide text-rose-300">
            {error}
          </div>
        ) : null}

        {loading && !controls ? (
          <div className="grid gap-6 md:grid-cols-2">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="flex h-32 flex-col justify-between rounded-3xl border border-white/5 bg-slate-950/40 p-6 animate-pulse"
              >
                <div className="h-4 w-24 rounded bg-slate-800" />
                <div className="h-10 w-20 self-end rounded-full bg-slate-800" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <div
              className={`relative overflow-hidden rounded-3xl border p-6 transition-all duration-500 ${
                controls?.kill_switch
                  ? "border-rose-500/50 bg-rose-950/20"
                  : "border-rose-500/20 bg-slate-950/60 hover:border-rose-500/40"
              }`}
            >
              {controls?.kill_switch ? (
                <div
                  className="pointer-events-none absolute inset-0 opacity-10"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(45deg, transparent, transparent 10px, #f43f5e 10px, #f43f5e 20px)",
                  }}
                />
              ) : null}

              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h4 className="text-[14px] font-black uppercase tracking-wide text-white">
                    Kill switch
                  </h4>
                  <p className="mt-1 text-[11px] font-medium text-slate-400">
                    Detención total del sistema.
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
                {controls?.kill_switch ? "Emergencia activa" : "Sistema normal"}
              </div>
            </div>

            <div
              className={`relative overflow-hidden rounded-3xl border p-6 transition-all duration-500 ${
                controls?.allow_write
                  ? "border-emerald-500/30 bg-emerald-950/10"
                  : "border-white/5 bg-slate-950/60 hover:border-emerald-500/30"
              }`}
            >
              {controls?.allow_write ? (
                <div className="pointer-events-none absolute inset-0 animate-pulse bg-emerald-500/5" />
              ) : null}

              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h4 className="text-[14px] font-black uppercase tracking-wide text-white">
                    Escritura
                  </h4>
                  <p className="mt-1 text-[11px] font-medium text-slate-400">
                    Permite cambios en el entorno.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void toggle("allow_write")}
                  disabled={loading || saving}
                  className={`relative inline-flex h-10 w-20 items-center rounded-full transition-all focus:outline-none disabled:opacity-50 ${
                    controls?.allow_write
                      ? "bg-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.6)]"
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
                {controls?.allow_write ? "Escritura habilitada" : "Solo lectura"}
              </div>
            </div>
          </div>
        )}

        {controls?.updated_at && !loading ? (
          <div className="mt-8 flex items-center justify-between border-t border-white/5 pt-5">
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <svg className="h-4 w-4 text-rose-500/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v4l3 3m0-4l-3 3m-5 9a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6z"
                />
              </svg>
              Última modificación: {lastUpdate}
            </div>

            <div className="hidden sm:block">
              <span className="text-[9px] font-black uppercase tracking-[0.3em] text-rose-500/30">
                Hocker Core Security
              </span>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}