"use client";

import { useEffect, useMemo, useState } from "react";
import { useWorkspace } from "@/components/WorkspaceContext";
import Hint from "@/components/Hint";

export default function GovernancePanel() {
  const { projectId: pid } = useWorkspace();

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
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
      <Hint title="Importante">
        Esto manda sobre TODO. Si algo se ve raro, primero activa <b>Kill Switch</b>.
      </Hint>

      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold text-slate-900">Centro de Seguridad</h2>
        <p className="text-sm text-slate-500">Proyecto activo: <b>{pid}</b></p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <strong>Atención:</strong> {error}
        </div>
      )}

      {loading ? (
        <div className="animate-pulse flex space-x-4">
          <div className="h-12 w-full rounded-xl bg-slate-200"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className={`rounded-2xl border p-5 ${controls?.kill_switch ? "border-red-500 bg-red-50" : "border-slate-200 bg-white"}`}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className={`font-bold ${controls?.kill_switch ? "text-red-700" : "text-slate-900"}`}>Kill Switch</h3>
                <p className={`mt-1 text-xs ${controls?.kill_switch ? "text-red-600" : "text-slate-500"}`}>
                  Si se activa, detiene ejecución y bloquea operaciones.
                </p>
              </div>
              <button
                onClick={() => toggle("kill_switch")}
                disabled={saving}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors disabled:opacity-50 ${controls?.kill_switch ? "bg-red-600" : "bg-slate-300"}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${controls?.kill_switch ? "translate-x-8" : "translate-x-1"}`} />
              </button>
            </div>
          </div>

          <div className={`rounded-2xl border p-5 ${controls?.allow_write ? "border-blue-500 bg-blue-50" : "border-slate-200 bg-white"}`}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className={`font-bold ${controls?.allow_write ? "text-blue-800" : "text-slate-900"}`}>Modo de escritura</h3>
                <p className={`mt-1 text-xs ${controls?.allow_write ? "text-blue-600" : "text-slate-500"}`}>
                  Permite crear acciones y modificar datos. Si está apagado: solo lectura.
                </p>
              </div>
              <button
                onClick={() => toggle("allow_write")}
                disabled={saving || controls?.kill_switch}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors disabled:opacity-50 ${controls?.allow_write ? "bg-blue-600" : "bg-slate-300"}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${controls?.allow_write ? "translate-x-8" : "translate-x-1"}`} />
              </button>
            </div>
          </div>
        </div>
      )}

      {controls?.updated_at && (
        <div className="text-right text-xs text-slate-400">
          Última actualización: {new Date(controls.updated_at).toLocaleString()}
        </div>
      )}
    </div>
  );
}