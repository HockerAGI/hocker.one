"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { defaultProjectId, normalizeProjectId } from "@/lib/project";

export default function GovernancePage() {
  const sb = useMemo(() => createBrowserSupabase(), []);
  const [projectId, setProjectId] = useState(defaultProjectId());
  const [kill, setKill] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("hocker_project_id");
      if (stored) setProjectId(normalizeProjectId(stored));
    } catch {}
  }, []);

  async function refresh() {
    setErr(null);
    const r = await sb
      .from("system_controls")
      .select("kill_switch, updated_at")
      .eq("project_id", projectId)
      .single();

    if (r.error) {
      setErr(r.error.message);
      return;
    }
    setKill(Boolean(r.data?.kill_switch));
    setUpdatedAt(r.data?.updated_at ?? null);
  }

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 2500);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  async function toggle(next: boolean) {
    setErr(null);
    const res = await fetch("/api/governance/killswitch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ project_id: projectId, action: next ? "on" : "off" })
    });

    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(j?.error ?? "Error");
      return;
    }
    setKill(Boolean(j.kill_switch));
    setUpdatedAt(j.updated_at ?? null);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4 space-y-2">
        <h1 className="text-xl font-semibold">Governance</h1>

        <div className="flex items-center gap-2">
          <span className="text-xs opacity-70">Project</span>
          <input
            className="rounded border px-3 py-2 text-sm"
            value={projectId}
            onChange={(e) => setProjectId(normalizeProjectId(e.target.value))}
          />
        </div>

        {err && <div className="text-sm text-red-600">{err}</div>}

        <div className="flex items-center justify-between rounded border p-3">
          <div>
            <div className="text-sm font-medium">Kill-switch</div>
            <div className="text-xs opacity-70">
              Estado: <b>{kill ? "ON (bloquea ejecución)" : "OFF"}</b>
              {updatedAt ? ` · actualizado ${new Date(updatedAt).toLocaleString()}` : ""}
            </div>
          </div>

          <div className="flex gap-2">
            <button className="rounded border px-3 py-2" onClick={() => toggle(false)} disabled={!kill}>
              Apagar
            </button>
            <button className="rounded bg-black text-white px-3 py-2" onClick={() => toggle(true)} disabled={kill}>
              Encender
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}