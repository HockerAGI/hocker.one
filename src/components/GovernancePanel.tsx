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
      const res = await fetch(`/api/governance/killswitch?project_id=${encodeURIComponent(pid)}`);
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Error al cargar los protocolos de seguridad.");
      setControls(j.controls);
    } catch (e: any) {
      setError(e.message);
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
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h2 className="text-xl font-black tracking-tight text-slate-900">Protocolos de Gobernanza</h2>
        <p className="text-sm text-slate-500">Control maestro de permisos y seguridad global del nodo.</p>
      </div>

      {error && (
        <div className="animate-in fade-in rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 shadow-sm flex items-center gap-3">
          <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 animate-pulse">
          <div className="h-[120px] rounded-3xl bg-slate-100"></div>
          <div className="h-[120px] rounded-3xl bg-slate-100"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Tarjeta Kill Switch */}
          <div className={`relative overflow-hidden rounded-3xl border p-6 transition-all duration-300 ${controls?.kill_switch ? "border-red-500 bg-red-50 shadow-lg shadow-red-500/10" : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <svg className={`h-5 w-5 ${controls?.kill_switch ? "text-red-600" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  <h3 className={`font-black tracking-tight ${controls?.kill_switch ? "text-red-800" : "text-slate-900"}`}>Kill Switch General</h3>
                </div>
                <p className={`mt-2 text-sm leading-relaxed ${controls?.kill_switch ? "text-red-700 font-medium" : "text-slate-500"}`}>
                  Detiene todas las operaciones inmediatamente. Si se activa, las AGIs dejarán de procesar.
                </p>
              </div>
              
              <button
                onClick={() => toggle("kill_switch")}
                disabled={saving}
                className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:opacity-50 ${
                  controls?.kill_switch ? "bg-red-600 shadow-[0_0_15px_rgba(239,68,68,0.4)]" : "bg-slate-200"
                }`}
                aria-label="Toggle Kill Switch"
              >
                <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${controls?.kill_switch ? "translate-x-6" : "translate-x-0"}`} />
              </button>
            </div>
            {controls?.kill_switch && (
              <div className="absolute top-0 right-0 -mr-4 -mt-4 h-24 w-24 rounded-full bg-red-500 opacity-10 blur-2xl"></div>
            )}
          </div>

          {/* Tarjeta Modo Escritura */}
          <div className={`relative overflow-hidden rounded-3xl border p-6 transition-all duration-300 ${controls?.allow_write ? "border-blue-500 bg-blue-50/50 shadow-lg shadow-blue-500/5" : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-md"}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                 <div className="flex items-center gap-2">
                  <svg className={`h-5 w-5 ${controls?.allow_write ? "text-blue-600" : "text-slate-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  <h3 className={`font-black tracking-tight ${controls?.allow_write ? "text-blue-800" : "text-slate-900"}`}>Modo de Escritura</h3>
                </div>
                <p className={`mt-2 text-sm leading-relaxed ${controls?.allow_write ? "text-blue-700" : "text-slate-500"}`}>
                  Permite inyectar comandos y modificar la memoria. Si se apaga, el panel entra en estado de solo lectura.
                </p>
              </div>
              
              <button
                onClick={() => toggle("allow_write")}
                disabled={saving || controls?.kill_switch}
                className={`relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  controls?.allow_write && !controls?.kill_switch ? "bg-blue-600" : "bg-slate-200"
                }`}
                aria-label="Toggle Modo Escritura"
              >
                <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${controls?.allow_write && !controls?.kill_switch ? "translate-x-6" : "translate-x-0"}`} />
              </button>
            </div>
          </div>
        </div>
      )}

      {controls?.updated_at && !loading && (
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 border-t border-slate-100 pt-4">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Última modificación de protocolos: {new Date(controls.updated_at).toLocaleString()}
        </div>
      )}
    </div>
  );
}
