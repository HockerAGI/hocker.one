"use client";

import React, { useEffect, useMemo, useState } from "react";
import AppNav from "@/components/AppNav";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { defaultProjectId } from "@/lib/project";

type AgiRow = {
  id: string;
  project_id: string;
  name: string;
  purpose: string | null;
  status: string;
  endpoints: any;
  permissions: any;
  updated_at: string;
};

export default function AgisPage() {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const [rows, setRows] = useState<AgiRow[]>([]);
  const [msg, setMsg] = useState("");
  const [projectId, setProjectId] = useState(defaultProjectId());

  async function load() {
    setMsg("");
    const { data, error } = await supabase
      .from("agis")
      .select("id,project_id,name,purpose,status,endpoints,permissions,updated_at")
      .eq("project_id", projectId)
      .order("updated_at", { ascending: false })
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
        <h1 style={{ margin: 0 }}>AGIs</h1>
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
        <div style={{ opacity: 0.75 }}>Registro y estado de IAs/nodos lógicos del ecosistema.</div>
      </header>

      <section style={{ marginTop: 16 }}>
        <div style={{ border: "1px solid #e6eefc", borderRadius: 16, padding: 16, background: "#fff" }}>
          {msg ? <div style={{ marginBottom: 10, fontSize: 13 }}>{msg}</div> : null}

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eef3ff" }}>ID</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eef3ff" }}>Nombre</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eef3ff" }}>Status</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eef3ff" }}>Purpose</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eef3ff" }}>Updated</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id}>
                    <td style={{ padding: 8, borderBottom: "1px solid #f6f8ff", whiteSpace: "nowrap" }}>{a.id}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #f6f8ff" }}>{a.name}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #f6f8ff" }}>{a.status}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #f6f8ff" }}>{a.purpose ?? "—"}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #f6f8ff", whiteSpace: "nowrap" }}>
                      {a.updated_at ? new Date(a.updated_at).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: 10, opacity: 0.7 }}>
                      No hay AGIs todavía (orchestrator las registra al primer request).
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