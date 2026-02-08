"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import type { CommandStatus } from "@/lib/types";
import { defaultProjectId, normalizeProjectId } from "@/lib/project";

type Cmd = {
  id: string;
  node_id: string | null;
  command: string;
  status: CommandStatus;
  created_at: string;
  approved_at?: string | null;
  needs_approval: boolean;
  project_id: string;
  payload?: any;
};

export default function CommandsQueue() {
  const sb = useMemo(() => createBrowserSupabase(), []);

  const [projectId, setProjectId] = useState<string>(defaultProjectId());
  const pid = useMemo(() => normalizeProjectId(projectId), [projectId]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [items, setItems] = useState<Cmd[]>([]);

  async function refresh() {
    setLoading(true);
    setErr(null);

    const { data, error } = await sb
      .from("commands")
      .select(
        "id,node_id,command,status,created_at,approved_at,needs_approval,project_id,payload"
      )
      .eq("project_id", pid)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) setErr(error.message);
    setItems((data as any) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid]);

  async function approve(id: string) {
    setErr(null);
    const res = await fetch("/api/commands/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, project_id: pid }),
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j?.error ?? `Approve failed (${res.status})`);
      return;
    }
    await refresh();
  }

  async function reject(id: string) {
    setErr(null);
    const res = await fetch("/api/commands/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, project_id: pid }),
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j?.error ?? `Reject failed (${res.status})`);
      return;
    }
    await refresh();
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ fontWeight: 700 }}>Project</div>
        <input
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          style={{
            flex: 1,
            minWidth: 260,
            padding: "8px 10px",
            borderRadius: 10,
            border: "1px solid #1f2937",
            background: "#0b1220",
            color: "#fff",
          }}
          placeholder="project_id"
        />
        <button
          onClick={refresh}
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: "1px solid #1f2937",
            background: "#0b1220",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Refresh
        </button>
      </div>

      {err && (
        <div
          style={{
            padding: 10,
            borderRadius: 12,
            border: "1px solid #7f1d1d",
            background: "rgba(185,28,28,0.15)",
            color: "#fecaca",
          }}
        >
          {err}
        </div>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {loading && <div style={{ opacity: 0.8 }}>Loading…</div>}
        {!loading && items.length === 0 && (
          <div style={{ opacity: 0.8 }}>No commands for this project.</div>
        )}

        {items.map((c) => (
          <div
            key={c.id}
            style={{
              border: "1px solid #1f2937",
              borderRadius: 16,
              padding: 14,
              background: "#0b1220",
              color: "#e5e7eb",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ fontWeight: 800, letterSpacing: 0.3 }}>
                  {c.command}{" "}
                  <span style={{ opacity: 0.75, fontWeight: 600 }}>
                    · {c.status}
                    {c.needs_approval ? " (needs approval)" : ""}
                  </span>
                </div>
                <div style={{ opacity: 0.75, fontSize: 13 }}>
                  id: {c.id} · node: {c.node_id ?? "—"} · project:{" "}
                  {c.project_id} ·{" "}
                  {new Date(c.created_at).toLocaleString()}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {c.needs_approval && c.status === "needs_approval" && (
                  <>
                    <button
                      onClick={() => approve(c.id)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 12,
                        border: "1px solid #065f46",
                        background: "rgba(16,185,129,0.12)",
                        color: "#a7f3d0",
                        cursor: "pointer",
                        fontWeight: 700,
                      }}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => reject(c.id)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 12,
                        border: "1px solid #7f1d1d",
                        background: "rgba(185,28,28,0.12)",
                        color: "#fecaca",
                        cursor: "pointer",
                        fontWeight: 700,
                      }}
                    >
                      Reject
                    </button>
                  </>
                )}
              </div>
            </div>

            {c.payload && (
              <pre
                style={{
                  marginTop: 10,
                  padding: 10,
                  borderRadius: 12,
                  border: "1px solid #111827",
                  background: "#060b16",
                  overflowX: "auto",
                  fontSize: 12,
                  color: "#c7d2fe",
                }}
              >
                {JSON.stringify(c.payload, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}