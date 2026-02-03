"use client";

import React, { useEffect, useMemo, useState } from "react";
import AppNav from "@/components/AppNav";
import { createBrowserSupabase } from "@/lib/supabase-browser";

export default function GovernancePage() {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [enabled, setEnabled] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    const { data, error } = await supabase.from("system_controls").select("kill_switch").eq("id", "global").single();
    if (error) return setMsg(error.message);
    setEnabled(Boolean(data?.kill_switch));
    setMsg("");
  }

  async function toggle(next: boolean) {
    setMsg("");
    const r = await fetch("/api/governance/killswitch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ enabled: next })
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return setMsg(j?.error ?? "Error");
    await load();
  }

  useEffect(() => { load(); }, []);

  return (
    <main style={{ maxWidth: 1100, margin: "28px auto", padding: 16 }}>
      <header style={{ display: "grid", gap: 12 }}>
        <h1 style={{ margin: 0 }}>Governance</h1>
        <AppNav />
        <div style={{ opacity: 0.75 }}>Kill-switch: bloquea ejecución de NOVA + Node en segundos.</div>
      </header>

      <section style={{ marginTop: 16 }}>
        <div style={{ border: "1px solid #e6eefc", borderRadius: 16, padding: 16, background: "#fff" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ fontSize: 14 }}>
              Estado:{" "}
              <b style={{ color: enabled ? "#b00020" : "#0b1b3a" }}>
                {enabled ? "ACTIVO (bloqueando)" : "INACTIVO"}
              </b>
            </div>

            <button
              onClick={() => toggle(!enabled)}
              style={{
                padding: "12px 14px",
                cursor: "pointer",
                borderRadius: 12,
                border: "1px solid #d6e3ff",
                background: enabled ? "#fff" : "#1e5eff",
                color: enabled ? "#0b1b3a" : "#fff"
              }}
            >
              {enabled ? "Desactivar" : "Activar"}
            </button>
          </div>

          {msg ? <div style={{ marginTop: 10, fontSize: 13 }}>{msg}</div> : null}
        </div>
      </section>
    </main>
  );
}