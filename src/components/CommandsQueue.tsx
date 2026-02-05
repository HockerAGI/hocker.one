"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { defaultProjectId, normalizeProjectId } from "@/lib/project";

type CommandRow = {
  id: string;
  project_id: string;
  node_id: string;
  command: string;
  status: string;
  created_at: string;
};

export default function CommandsQueue() {
  const sb = useMemo(() => createBrowserSupabase(), []);
  const [projectId, setProjectId] = useState(defaultProjectId());
  const [rows, setRows] = useState<CommandRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("hocker_project_id");
      if (stored) setProjectId(normalizeProjectId(stored));
    } catch {}
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setErr(null);
      const { data, error } = await sb
        .from("commands")
        .select("id,project_id,node_id,command,status,created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (cancelled) return;
      if (error) setErr(error.message);
      else setRows((data ?? []) as any);
    }

    load();
    const t = setInterval(load, 2500);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [sb, projectId]);

  async function approve(id: string) {
    setErr(null);
    const r = await fetch("/api/commands/approve", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id })
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) setErr(j?.error ?? "Error aprobando");
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold">Commands Queue</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs opacity-70">Project</span>
          <input
            className="rounded border px-3 py-2 text-sm"
            value={projectId}
            onChange={(e) => setProjectId(normalizeProjectId(e.target.value))}
          />
        </div>
      </div>

      {err && <div className="text-sm text-red-600">{err}</div>}

      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead className="text-left opacity-70">
            <tr>
              <th className="py-2 pr-3">ID</th>
              <th className="py-2 pr-3">Node</th>
              <th className="py-2 pr-3">Command</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Created</th>
              <th className="py-2 pr-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="py-2 pr-3 font-mono">{r.id.slice(0, 8)}…</td>
                <td className="py-2 pr-3">{r.node_id}</td>
                <td className="py-2 pr-3">{r.command}</td>
                <td className="py-2 pr-3">{r.status}</td>
                <td className="py-2 pr-3">{new Date(r.created_at).toLocaleString()}</td>
                <td className="py-2 pr-3">
                  {r.status === "needs_approval" ? (
                    <button
                      className="rounded border px-3 py-1"
                      onClick={() => approve(r.id)}
                    >
                      Aprobar
                    </button>
                  ) : (
                    <span className="opacity-60">—</span>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td className="py-4 opacity-60" colSpan={6}>
                  Sin comandos
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}