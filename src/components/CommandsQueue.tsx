"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import type { CommandStatus } from "@/lib/types";

type Cmd = {
  id: string;
  node_id: string | null;
  command: string;
  status: CommandStatus;
  created_at: string;
};

export default function CommandsQueue() {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [rows, setRows] = useState<Cmd[]>([]);
  const [msg, setMsg] = useState("");

  async function load() {
    const { data, error } = await supabase
      .from("commands")
      .select("id,node_id,command,status,created_at")
      .order("created_at", { ascending: false })
      .limit(60);

    if (error) return setMsg(error.message);
    setRows((data ?? []) as any);
    setMsg("");
  }

  async function approve(id: string) {
    setMsg("");
    const r = await fetch("/api/commands/approve", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id })
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return setMsg(j?.error ?? "Error");
    await load();
  }

  useEffect(() => { load(); }, []);

  return (
    <div style={{ border: "1px solid #e6eefc", borderRadius: 16, padding: 16, background: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0 }}>Commands</h2>
        <button onClick={load} style={{ padding: "12px 14px", cursor: "pointer", borderRadius: 12, border: "1px solid #d6e3ff", background: "#fff" }}>
          Recargar
        </button>
      </div>

      {msg ? <div style={{ marginTop: 10, fontSize: 13 }}>{msg}</div> : null}

      <div style={{ marginTop: 12, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eef3ff" }}>Fecha</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eef3ff" }}>Node</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eef3ff" }}>Command</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eef3ff" }}>Status</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eef3ff" }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td style={{ padding: 8, borderBottom: "1px solid #f6f8ff", whiteSpace: "nowrap" }}>{new Date(c.created_at).toLocaleString()}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #f6f8ff" }}>{c.node_id ?? "—"}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #f6f8ff" }}>{c.command}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #f6f8ff" }}>{c.status}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #f6f8ff" }}>
                  {c.status === "needs_approval" ? (
                    <button onClick={() => approve(c.id)} style={{ padding: "8px 10px", cursor: "pointer", borderRadius: 10, border: "1px solid #1e5eff", background: "#1e5eff", color: "#fff" }}>
                      Aprobar
                    </button>
                  ) : (
                    <span style={{ opacity: 0.65 }}>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}