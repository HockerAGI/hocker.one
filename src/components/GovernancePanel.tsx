"use client";

import React, { useEffect, useMemo, useState } from "react";
import { defaultProjectId, normalizeProjectId } from "@/lib/project";

type Controls = {
  id: string;
  project_id: string;
  kill_switch: boolean;
  allow_write: boolean;
  updated_at: string | null;
};

export default function GovernancePanel() {
  const [projectId, setProjectId] = useState<string>(defaultProjectId());
  const pid = useMemo(() => normalizeProjectId(projectId), [projectId]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const [controls, setControls] = useState<Controls>({
    id: "global",
    project_id: pid,
    kill_switch: false,
    allow_write: false,
    updated_at: null,
  });

  async function load() {
    setErr(null);
    setOkMsg(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/governance/killswitch?project_id=${encodeURIComponent(pid)}`, {
        method: "GET",
        headers: { "content-type": "application/json" },
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "No se pudo cargar governance.");
      const c = (j?.controls ?? null) as Controls | null;

      setControls({
        id: c?.id ?? "global",
        project_id: pid,
        kill_switch: !!c?.kill_switch,
        allow_write: !!c?.allow_write,
        updated_at: c?.updated_at ?? null,
      });
    } catch (e: any) {
      setErr(e?.message ?? "No se pudo cargar governance.");
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    setErr(null);
    setOkMsg(null);
    setSaving(true);
    try {
      const res = await fetch("/api/governance/killswitch", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          project_id: pid,
          kill_switch: !!controls.kill_switch,
          allow_write: !!controls.allow_write,
        }),
      });

      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "No se pudo guardar governance.");

      setOkMsg("Guardado. ✅");
      await load();
    } catch (e: any) {
      setErr(e?.message ?? "No se pudo guardar governance.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <div className="text-lg font-semibold text-slate-900">Governance</div>
          <div className="text-sm text-slate-500">
            Controles por proyecto (PK: <span className="font-semibold">id + project_id</span>).
            Solo <span className="font-semibold">owner</span> puede modificar.
          </div>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-end">
          <div className="w-full md:w-[320px]">
            <label className="text-xs font-semibold text-slate-600">Project</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-400"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="global"
            />
          </div>

          <button
            onClick={load}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            disabled={loading || saving}
          >
            Refresh
          </button>
        </div>
      </div>

      {err && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{err}</div>
      )}
      {okMsg && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {okMsg}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-2 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">project:</span> {pid} ·{" "}
          <span className="font-semibold text-slate-700">updated:</span>{" "}
          {controls.updated_at ? new Date(controls.updated_at).toLocaleString() : "—"}
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4"
              checked={!!controls.kill_switch}
              onChange={(e) => setControls((c) => ({ ...c, kill_switch: e.target.checked }))}
            />
            <div className="space-y-1">
              <div className="text-sm font-semibold text-slate-900">Kill switch</div>
              <div className="text-xs text-slate-600">
                Si está <span className="font-semibold">ON</span>, bloquea la emisión de comandos (y registra event).
              </div>
            </div>
          </label>

          <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4"
              checked={!!controls.allow_write}
              onChange={(e) => setControls((c) => ({ ...c, allow_write: e.target.checked }))}
            />
            <div className="space-y-1">
              <div className="text-sm font-semibold text-slate-900">Allow write</div>
              <div className="text-xs text-slate-600">
                Si está <span className="font-semibold">OFF</span>, comandos sensibles van a{" "}
                <span className="font-semibold">needs_approval</span>.
              </div>
            </div>
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={save}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
            disabled={loading || saving}
          >
            {saving ? "Saving…" : "Save"}
          </button>

          <button
            onClick={load}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 disabled:opacity-50"
            disabled={loading || saving}
          >
            Cancel / Reload
          </button>
        </div>

        <div className="mt-3 text-[11px] text-slate-500">
          Si te dice “solo owner”, es correcto: la API lo bloquea por rol.
        </div>
      </div>
    </div>
  );
}