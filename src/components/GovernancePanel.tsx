"use client";

import { getErrorMessage } from "@/lib/errors";
import { useEffect, useState } from "react";
import { useWorkspace } from "@/components/WorkspaceContext";

interface SecurityControls {
  kill_switch: boolean;
  allow_write: boolean;
  updated_at: string;
}

export default function GovernancePanel() {
  const { projectId: pid } = useWorkspace();
  const [controls, setControls] = useState<SecurityControls | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/governance/killswitch?project_id=${encodeURIComponent(pid)}`, { cache: "no-store" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Error al cargar protocolos.");
      setControls(j.controls);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
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
      if (!res.ok) throw new Error(j?.error || "Falla al ejecutar protocolo.");
      setControls(j.controls);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="hocker-panel-pro overflow-hidden border-rose-500/20 shadow-[0_0_30px_rgba(225,29,72,0.05)]">
      <div className="flex items-center justify-between border-b border-rose-500/10 bg-gradient-to-r from-rose-500/10 to-transparent p-6">
        <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-rose-500">
          Control de Autoridad
        </h3>
        {saving && (
          <span className="animate-pulse text-[9px] font-black uppercase tracking-widest text-rose-400">
            Ejecutando...
          </span>
        )}
      </div>

      <div className="p-6 sm:p-8">
        {error && (
          <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-[11px] font-bold uppercase tracking-wide text-rose-300">
            {error}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* KILL SWITCH TACTICAL */}
          <div className="relative overflow-hidden rounded-3xl border border-rose-500/20 bg-slate-950/60 p-6 transition hover:border-rose-500/40">
            {controls?.kill_switch && <div className="absolute inset-0 bg-rose-500/5 animate-pulse" />}
            <div className="relative flex items-center justify-between">
              <div>
                <h4 className="text-[14px] font-black uppercase tracking-wide text-white">Kill Switch</h4>
                <p className="mt-1 text-[11px] font-medium text-slate-400">Detención total de IA.</p>
              </div>
              <button
                onClick={() => toggle("kill_switch")}
                disabled={loading || saving}
                className={`relative inline-flex h-10 w-20 items-center rounded-full transition-all focus:outline-none disabled:opacity-50 ${
                  controls?.kill_switch ? "bg-rose-600 shadow-[0_0_20px_rgba(225,29,72,0.6)]" : "bg-slate-800"
                }`}
              >
                <span className={`inline-block h-8 w-8 transform rounded-full bg-white transition-all shadow-md ${
                  controls?.kill_switch ? "translate-x-11" : "translate-x-1"
                }`} />
              </button>
            </div>
            <div className={`mt-5 inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${
              controls?.kill_switch ? "border-rose-400/20 bg-rose-500/10 text-rose-400" : "border-white/10 bg-white/5 text-slate-400"
            }`}>
              {controls?.kill_switch ? "Emergencia Activa" : "Sistema Normal"}
            </div>
          </div>

          {/* ALLOW WRITE TACTICAL */}
          <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-slate-950/60 p-6 transition hover:border-emerald-500/30">
            <div className="relative flex items-center justify-between">
              <div>
                <h4 className="text-[14px] font-black uppercase tracking-wide text-white">Escritura de IA</h4>
                <p className="mt-1 text-[11px] font-medium text-slate-400">Modificación de entorno.</p>
              </div>
              <button
                onClick={() => toggle("allow_write")}
                disabled={loading || saving}
                className={`relative inline-flex h-10 w-20 items-center rounded-full transition-all focus:outline-none disabled:opacity-50 ${
                  controls?.allow_write ? "bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]" : "bg-slate-800"
                }`}
              >
                <span className={`inline-block h-8 w-8 transform rounded-full bg-white transition-all shadow-md ${
                  controls?.allow_write ? "translate-x-11" : "translate-x-1"
                }`} />
              </button>
            </div>
            <div className={`mt-5 inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${
              controls?.allow_write ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-400" : "border-white/10 bg-white/5 text-slate-400"
            }`}>
              {controls?.allow_write ? "Escritura Habilitada" : "Solo Lectura"}
            </div>
          </div>
        </div>

        {controls?.updated_at && !loading && (
          <div className="mt-6 flex items-center gap-2 border-t border-white/5 pt-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
            <svg className="h-4 w-4 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m0-4l-3 3m-5 9a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6z" />
            </svg>
            Última actualización: {new Date(controls.updated_at).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}
