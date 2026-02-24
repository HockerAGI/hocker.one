"use client";

import { useEffect, useState, useMemo } from "react";
import { defaultProjectId, normalizeProjectId } from "@/lib/project";

export default function GovernancePanel() {
  const [projectId, setProjectId] = useState(defaultProjectId());
  const pid = useMemo(() => normalizeProjectId(projectId), [projectId]);

  const [controls, setControls] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/governance/killswitch?project_id=${encodeURIComponent(pid)}`);
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Error al cargar la seguridad.");
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
      if (!res.ok) throw new Error(j?.error || "Error al guardar los cambios.");
      setControls(j.controls);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Centro de Seguridad Suprema</h2>
          <p className="text-sm text-slate-500">Controla quién y qué puede operar en tu ecosistema.</p>
        </div>
        <div className="w-full md:w-72">
          <label className="mb-1 block text-xs font-semibold text-slate-600">Proyecto Activo</label>
          <input
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <strong>Atención:</strong> {error}
        </div>
      )}

      {loading ? (
        <div className="animate-pulse flex space-x-4">
          <div className="h-12 w-full rounded-xl bg-slate-200"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Tarjeta de Bloqueo de Emergencia */}
          <div className={`relative overflow-hidden rounded-2xl border p-5 transition-all ${controls?.kill_switch ? 'border-red-500 bg-red-50' : 'border-slate-200 bg-white'}`}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className={`font-bold ${controls?.kill_switch ? 'text-red-700' : 'text-slate-900'}`}>
                  Bloqueo de Emergencia
                </h3>
                <p className={`mt-1 text-xs ${controls?.kill_switch ? 'text-red-600' : 'text-slate-500'}`}>
                  Si se activa, detiene TODA la infraestructura de inmediato. Nadie podrá ejecutar acciones.
                </p>
              </div>
              <button
                onClick={() => toggle("kill_switch")}
                disabled={saving}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors disabled:opacity-50 ${controls?.kill_switch ? 'bg-red-600' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${controls?.kill_switch ? 'translate-x-8' : 'translate-x-1'}`} />
              </button>
            </div>
            {controls?.kill_switch && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-100 p-2 text-xs font-semibold text-red-800">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
                </span>
                SISTEMA DETENIDO POR SEGURIDAD
              </div>
            )}
          </div>

          {/* Tarjeta de Permisos de Escritura */}
          <div className={`relative overflow-hidden rounded-2xl border p-5 transition-all ${controls?.allow_write ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'}`}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className={`font-bold ${controls?.allow_write ? 'text-blue-800' : 'text-slate-900'}`}>
                  Modo de Escritura
                </h3>
                <p className={`mt-1 text-xs ${controls?.allow_write ? 'text-blue-600' : 'text-slate-500'}`}>
                  Permite a la inteligencia artificial modificar datos y ejecutar comandos financieros reales.
                </p>
              </div>
              <button
                onClick={() => toggle("allow_write")}
                disabled={saving || controls?.kill_switch}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors disabled:opacity-50 ${controls?.allow_write ? 'bg-blue-600' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${controls?.allow_write ? 'translate-x-8' : 'translate-x-1'}`} />
              </button>
            </div>
            {!controls?.allow_write && !controls?.kill_switch && (
              <div className="mt-4 rounded-lg bg-slate-100 p-2 text-xs font-medium text-slate-600">
                Modo lectura activo. La IA solo puede observar.
              </div>
            )}
          </div>
        </div>
      )}
      
      {controls?.updated_at && (
        <div className="mt-4 text-right text-xs text-slate-400">
          Última actualización de seguridad: {new Date(controls.updated_at).toLocaleString()}
        </div>
      )}
    </div>
  );
}