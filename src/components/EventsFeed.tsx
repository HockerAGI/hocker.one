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

  const [nodeId, setNodeId] = useState("local-node-01");
  const [level, setLevel] = useState<EventLevel>("info");
  const [type, setType] = useState("manual");
  const [message, setMessage] = useState("Evento de prueba desde HOCKER ONE");

  async function load() {
    const { data, error } = await supabase
      .from("events")
      .select("id,node_id,level,type,message,created_at")
      .order("created_at", { ascending: false })
      .limit(25);

    if (error) {
      setMsg(error.message);
      return;
    }
    setEvents((data ?? []) as EventRow[]);
    setMsg("");
  }

  async function addEvent() {
    setMsg("");
    const { error } = await supabase.from("events").insert({
      node_id: nodeId,
      level,
      type,
      message,
      data: {}
    });
    if (error) return setMsg(error.message);
    setMsg("✅ Evento creado.");
    await load();
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>Eventos (últimos 25)</h2>

      <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Node ID</span>
            <input
              value={nodeId}
              onChange={(e) => setNodeId(e.target.value)}
              style={{ padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Nivel</span>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as EventLevel)}
              style={{ padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
            >
              <option value="info">info</option>
              <option value="warn">warn</option>
              <option value="error">error</option>
            </select>
          </label>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span>Tipo</span>
            <input
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={{ padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span>Mensaje</span>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
            />
          </label>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button onClick={addEvent} style={{ padding: "10px 12px", cursor: "pointer" }}>
            Crear evento
          </button>
          <button onClick={load} style={{ padding: "10px 12px", cursor: "pointer" }}>
            Recargar
          </button>
        </div>

        {msg ? <div style={{ fontSize: 13, opacity: 0.85 }}>{msg}</div> : null}
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eee" }}>Hora</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eee" }}>Node</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eee" }}>Nivel</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eee" }}>Tipo</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eee" }}>Mensaje</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id}>
                <td style={{ padding: 8, borderBottom: "1px solid #f3f3f3", whiteSpace: "nowrap" }}>
                  {new Date(e.created_at).toLocaleString()}
                </td>
                <td style={{ padding: 8, borderBottom: "1px solid #f3f3f3" }}>{e.node_id ?? "—"}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #f3f3f3" }}>{e.level}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #f3f3f3" }}>{e.type}</td>
                <td style={{ padding: 8, borderBottom: "1px solid #f3f3f3" }}>{e.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}