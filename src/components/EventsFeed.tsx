"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import type { EventLevel } from "@/lib/types";

type EventRow = {
  id: string;
  node_id: string | null;
  level: EventLevel;
  type: string;
  message: string;
  created_at: string;
};

export default function EventsFeed() {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [msg, setMsg] = useState("");

  const [nodeId, setNodeId] = useState(process.env.NEXT_PUBLIC_HOCKER_DEFAULT_NODE_ID || "node-hocker-01");
  const [level, setLevel] = useState<EventLevel>("info");
  const [type, setType] = useState("manual");
  const [message, setMessage] = useState("Nota manual desde HOCKER ONE");

  async function load() {
    const q = supabase
      .from("events")
      .select("id,node_id,level,type,message,created_at")
      .order("created_at", { ascending: false })
      .limit(40);

    const { data, error } = nodeId ? await q.eq("node_id", nodeId) : await q;
    if (error) return setMsg(error.message);

    setEvents((data ?? []) as any);
    setMsg("");
  }

  async function addManualEvent() {
    setMsg("");
    const r = await fetch("/api/events/manual", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ node_id: nodeId, level, type, message })
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return setMsg(j?.error ?? "Error");

    setMsg("✅ Nota creada.");
    await load();
  }

  useEffect(() => { load(); }, []);

  return (
    <div style={{ border: "1px solid #e6eefc", borderRadius: 16, padding: 16, background: "#fff" }}>
      <h2 style={{ marginTop: 0 }}>Eventos</h2>

      <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Filtrar por Node ID</span>
          <input value={nodeId} onChange={(e) => setNodeId(e.target.value)} style={{ padding: 12, borderRadius: 12, border: "1px solid #d6e3ff" }} />
        </label>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Nivel</span>
            <select value={level} onChange={(e) => setLevel(e.target.value as EventLevel)} style={{ padding: 12, borderRadius: 12, border: "1px solid #d6e3ff" }}>
              <option value="info">info</option>
              <option value="warn">warn</option>
              <option value="error">error</option>
              <option value="critical">critical</option>
            </select>
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Tipo</span>
            <input value={type} onChange={(e) => setType(e.target.value)} style={{ padding: 12, borderRadius: 12, border: "1px solid #d6e3ff" }} />
          </label>
        </div>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Mensaje</span>
          <input value={message} onChange={(e) => setMessage(e.target.value)} style={{ padding: 12, borderRadius: 12, border: "1px solid #d6e3ff" }} />
        </label>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={addManualEvent} style={{ padding: "12px 14px", cursor: "pointer", borderRadius: 12, border: "1px solid #1e5eff", background: "#1e5eff", color: "#fff" }}>
            Crear nota
          </button>
          <button onClick={load} style={{ padding: "12px 14px", cursor: "pointer", borderRadius: 12, border: "1px solid #d6e3ff", background: "#fff" }}>
            Recargar
          </button>
        </div>

        {msg ? <div style={{ fontSize: 13, opacity: 0.85 }}>{msg}</div> : null}
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eef3ff" }}>Hora</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eef3ff" }}>Node</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eef3ff" }}>Nivel</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eef3ff" }}>Tipo</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eef3ff" }}>Mensaje</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id}>
                <td style={{ padding: 8, borderBottom: "1px solid #f6f8ff", whiteSpace: "nowrap" }}>{new Date(e.created_at).toLocaleString()}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #f6f8ff" }}>{e.node_id ?? "—"}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #f6f8ff" }}>{e.level}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #f6f8ff" }}>{e.type}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #f6f8ff" }}>{e.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}