"use client";

import React, { useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import type { CommandStatus } from "@/lib/types";

export default function CommandBox() {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [nodeId, setNodeId] = useState(process.env.HOCKER_DEFAULT_NODE_ID || "local-node-01");
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

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id ?? null;

    const { error } = await supabase.from("commands").insert({
      node_id: nodeId,
      command,
      payload: payloadObj,
      status: "queued" as CommandStatus,
      created_by: userId
    });

    if (error) return setMsg(error.message);
    setMsg("✅ Comando enviado a cola.");
  }

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 12, padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>Enviar comando</h2>
      <div style={{ display: "grid", gap: 10 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Node ID</span>
          <input value={nodeId} onChange={(e) => setNodeId(e.target.value)} style={{ padding: 10, borderRadius: 10, border: "1px solid #ccc" }} />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Comando</span>
          <input value={command} onChange={(e) => setCommand(e.target.value)} style={{ padding: 10, borderRadius: 10, border: "1px solid #ccc" }} />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <span>Payload (JSON)</span>
          <textarea
            value={payload}
            onChange={(e) => setPayload(e.target.value)}
            rows={5}
            style={{ padding: 10, borderRadius: 10, border: "1px solid #ccc", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" }}
          />
        </label>

        <button onClick={send} style={{ padding: "10px 12px", cursor: "pointer" }}>
          Enviar
        </button>

        {msg ? <div style={{ fontSize: 13, opacity: 0.85 }}>{msg}</div> : null}

        <div style={{ fontSize: 12, opacity: 0.7 }}>
          Ejemplos de comandos: <code>status</code>, <code>reboot</code>, <code>run_task</code>, <code>deploy</code>.
        </div>
      </div>
    </div>
  );
}