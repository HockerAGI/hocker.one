"use client";

import React, { useState } from "react";

export default function CommandBox() {
  const [nodeId, setNodeId] = useState(process.env.NEXT_PUBLIC_HOCKER_DEFAULT_NODE_ID || "node-hocker-01");
  const [command, setCommand] = useState("status");
  const [payload, setPayload] = useState(`{}`);
  const [msg, setMsg] = useState<string>("");

  async function send() {
    setMsg("");
    let payloadObj: any = {};
    try {
      payloadObj = payload?.trim() ? JSON.parse(payload) : {};
    } catch {
      return setMsg("Payload debe ser JSON válido. Ej: {}");
    }

    const r = await fetch("/api/commands", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ node_id: nodeId, command, payload: payloadObj })
    });

    const j = await r.json().catch(() => ({}));
    if (!r.ok) return setMsg(j?.error ?? "Error");
    setMsg(`✅ Encolado. id: ${j.id}`);
  }

  return (
    <div style={{ border: "1px solid #e6eefc", borderRadius: 16, padding: 16, background: "#fff" }}>
      <h2 style={{ marginTop: 0 }}>Enviar comando (firmado)</h2>

      <div style={{ display: "grid", gap: 10 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Node ID</span>
          <input value={nodeId} onChange={(e) => setNodeId(e.target.value)} style={{ padding: 12, borderRadius: 12, border: "1px solid #d6e3ff" }} />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Comando</span>
          <select value={command} onChange={(e) => setCommand(e.target.value)} style={{ padding: 12, borderRadius: 12, border: "1px solid #d6e3ff" }}>
            <option value="status">status</option>
            <option value="ping">ping</option>
          </select>
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Payload (JSON)</span>
          <textarea
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            rows={5}
            style={{
              padding: 12,
              borderRadius: 12,
              border: "1px solid #d6e3ff",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
            }}
          />
        </label>

        <button onClick={send} style={{ padding: "12px 14px", cursor: "pointer", borderRadius: 12, border: "1px solid #1e5eff", background: "#1e5eff", color: "#fff" }}>
          Enviar
        </button>

        {msg ? <div style={{ fontSize: 13, opacity: 0.85 }}>{msg}</div> : null}
      </div>
    </div>
  );
}