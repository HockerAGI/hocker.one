"use client";

import React, { useEffect, useMemo, useState } from "react";
import AppNav from "@/components/AppNav";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { defaultProjectId } from "@/lib/project";

type NodeRow = {
  id: string;
  project_id: string;
  name: string;
  type: string;
  status: string;
  last_seen_at: string | null;
  meta: any;
  created_at: string;
};

function ago(ts: string | null) {
  if (!ts) return "—";
  const d = new Date(ts).getTime();
  const diff = Math.max(0, Date.now() - d);
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h`;
  const days = Math.floor(h / 24);
  return `${days}d`;
}

export default function NodesPage() {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [rows, setRows] = useState<NodeRow[]>([]);
  const [msg, setMsg] = useState("");
  const [projectId, setProjectId] = useState(defaultProjectId());

  async function load() {
    setMsg("");
    const { data, error } = await supabase
      .from("nodes")
      .select("id,project_id,name,type,status,last_seen_at,meta,created_at")
      .eq("project_id", projectId)
      .order("last_seen_at", { ascending: false })
      .limit(200);

    if (error) return setMsg(error.message);
    setRows((data ?? []) as any);
  }

  useEffect(() => {
    load();
  }, [projectId]);

  return (
    <main style={{ maxWidth: 1100, margin: "28px auto", padding: 16 }}>
      <header style={{ display: "grid", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Nodes</h1>
        <AppNav />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 12, opacity: 0.8 }}>Project</span>
            <input
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              style={{ padding: 10, borderRadius: 12, border: "1px solid #d6e3ff" }}
            />
          </label>
          <button
            onClick={load}
            style={{ padding: "12px 14px", cursor: "pointer", borderRadius: 12, border: "1px solid #d6e3ff", background: "#fff" }}
          >
            Recargar
          </button>
        </div>
        <div style={{ opacity: 0.75 }}>Monitoreo: heartbeat + metadata (host/platform) + “last seen”.</div>
      </header>

      <section style={{ marginTop: 16 }}>
        <div style={{ border: "1px solid #e6eefc", borderRadius: 16, padding: 16, background: "#fff" }}>
          {msg ? <div style={{ marginBottom: 10, fontSize: 13 }}>{msg}</div> : null}

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eef3ff" }}>Node</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eef3ff" }}>Status</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eef3ff" }}>Seen</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eef3ff" }}>Host</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eef3ff" }}>Platform</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((n) => (
                  <tr key={n.id}>
                    <td style={{ padding: 8, borderBottom: "1px solid #f6f8ff", whiteSpace: "nowrap" }}>{n.id}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #f6f8ff" }}>{n.status}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #f6f8ff" }}>{ago(n.last_seen_at)}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #f6f8ff" }}>{n.meta?.hostname ?? "—"}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #f6f8ff" }}>{n.meta?.platform ?? "—"}</td>
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 10, opacity: 0.7 }}>
                      No hay nodes todavía (cuando corra el agent, aparece).
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}