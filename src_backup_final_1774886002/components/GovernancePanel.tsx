import { getErrorMessage } from "@/lib/errors";
"use client";

import { useEffect, useState } from "react";
import { useWorkspace } from "@/components/WorkspaceContext";

export default function GovernancePanel() {
  const { projectId: pid } = useWorkspace();
  const [controls, setControls] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/governance/killswitch?project_id=${encodeURIComponent(pid)}`, { cache: "no-store" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Error al cargar los protocolos de seguridad.");
      setControls(j.controls);
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid]);

  async function toggle(field: "kill_switch" | "allow_write") {
    if (!controls) return;
    setSaving(true);
    setError(null);

    try {
      const payload = {
        project_id: pid,
        kill_switch: field === "kill_switch" ? !controls.kill_switch : controls.kill_switch,
        allow_write: field === "allow_write" ? !controls.allow_write : controls.allow_write,
      };

      const res = await fetch("/api/governance/killswitch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Error al actualizar los protocolos.");
      setControls(j.controls);
    } catch (e: unknown) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-6 rounded-[28px] border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-black/30 backdrop-blur-2xl">
      <div>
        <h2 className="text-xl font-black tracking-tight text-white">Protocolos de Gobernanza</h2>
        <p className="mt-1 text-sm text-slate-400">Control maestro de permisos y seguridad global del nodo.</p>
      </div>

      {error ? (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm font-medium text-rose-200">
          <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="h-[120px] animate-pulse rounded-3xl bg-white/5" />
          <div className="h-[120px] animate-pulse rounded-3xl bg-white/5" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className={`rounded-3xl border p-6 ${controls?.kill_switch ? "border-rose-400/20 bg-rose-500/10" : "border-white/10 bg-white/5"}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-black tracking-tight text-white">Kill Switch</h3>
                <p className="mt-1 text-sm text-slate-400">Corte global para detener automatizaciones.</p>
              </div>
              <button
                type="button"
                onClick={() => toggle("kill_switch")}
                disabled={saving}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
                  controls?.kill_switch ? "bg-rose-500" : "bg-slate-600"
                }`}
                aria-label="Toggle Kill Switch"
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                    controls?.kill_switch ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            <div className={`mt-5 inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] ${
              controls?.kill_switch ? "border-rose-400/20 bg-rose-500/10 text-rose-200" : "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
            }`}>
              {controls?.kill_switch ? "Activado" : "Desactivado"}
            </div>
          </div>

          <div className={`rounded-3xl border p-6 ${controls?.allow_write ? "border-emerald-400/20 bg-emerald-500/10" : "border-white/10 bg-white/5"}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-black tracking-tight text-white">Allow Write</h3>
                <p className="mt-1 text-sm text-slate-400">Permiso maestro para inyección de código y órdenes.</p>
              </div>
              <button
                type="button"
                onClick={() => toggle("allow_write")}
                disabled={saving}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${
                  controls?.allow_write ? "bg-emerald-500" : "bg-slate-600"
                }`}
                aria-label="Toggle Allow Write"
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white transition ${
                    controls?.allow_write ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
            <div className={`mt-5 inline-flex rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em] ${
              controls?.allow_write ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200" : "border-white/10 bg-white/5 text-slate-200"
            }`}>
              {controls?.allow_write ? "Escritura habilitada" : "Solo lectura"}
            </div>
          </div>
        </div>
      )}

      {controls?.updated_at && !loading ? (
        <div className="flex items-center gap-2 border-t border-white/5 pt-4 text-xs font-semibold text-slate-400">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Última modificación de protocolos: {new Date(controls.updated_at).toLocaleString()}
        </div>
      ) : null}
    </section>
  );
}