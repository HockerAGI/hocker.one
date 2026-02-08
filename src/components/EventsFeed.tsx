"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { defaultProjectId, normalizeProjectId } from "@/lib/project";

type Ev = {
  id: string;
  type: string;
  severity: string;
  message: string;
  created_at: string;
  project_id: string;
  meta?: any;
};

export default function EventsFeed() {
  const sb = useMemo(() => createBrowserSupabase(), []);

  const [projectId, setProjectId] = useState<string>(defaultProjectId());
  const pid = useMemo(() => normalizeProjectId(projectId), [projectId]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [items, setItems] = useState<Ev[]>([]);
  const [manualMsg, setManualMsg] = useState("");
  const [manualType, setManualType] = useState("manual");
  const [manualSeverity, setManualSeverity] =
    useState<"info" | "warn" | "error">("info");

  async function refresh() {
    setLoading(true);
    setErr(null);

    const { data, error } = await sb
      .from("events")
      .select("id,type,severity,message,created_at,project_id,meta")
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

  async function postManual() {
    if (!manualMsg.trim()) return;
    setErr(null);

    const res = await fetch("/api/events/manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project_id: pid,
        type: manualType,
        severity: manualSeverity,
        message: manualMsg,
      }),
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j?.error ?? `Manual event failed (${res.status})`);
      return;
    }

    setManualMsg("");
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

      <div
        style={{
          border: "1px solid #1f2937",
          borderRadius: 16,
          padding: 14,
          background: "#0b1220",
          color: "#e5e7eb",
          display: "grid",
          gap: 10,
        }}
      >
        <div style={{ fontWeight: 800 }}>Manual event</div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            value={manualType}
            onChange={(e) => setManualType(e.target.value)}
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid #1f2937",
              background: "#060b16",
              color: "#fff",
              minWidth: 180,
            }}
            placeholder="type"
          />
          <select
            value={manualSeverity}
            onChange={(e) => setManualSeverity(e.target.value as any)}
            style={{
              padding: "8px 10px",
              borderRadius: 10,
              border: "1px solid #1f2937",
              background: "#060b16",
              color: "#fff",
              minWidth: 140,
            }}
          >
            <option value="info">info</option>
            <option value="warn">warn</option>
            <option value="error">error</option>
          </select>
          <button
            onClick={postManual}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid #1f2937",
              background: "#0b1220",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 700,
            }}
          >
            Post
          </button>
        </div>

        <textarea
          value={manualMsg}
          onChange={(e) => setManualMsg(e.target.value)}
          rows={3}
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 12,
            border: "1px solid #1f2937",
            background: "#060b16",
            color: "#fff",
            resize: "vertical",
          }}
          placeholder="message"
        />

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
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        {loading && <div style={{ opacity: 0.8 }}>Loading…</div>}
        {!loading && items.length === 0 && (
          <div style={{ opacity: 0.8 }}>No events for this project.</div>
        )}

        {items.map((e) => (
          <div
            key={e.id}
            style={{
              border: "1px solid #1f2937",
              borderRadius: 16,
              padding: 14,
              background: "#0b1220",
              color: "#e5e7eb",
            }}
          >
            <div style={{ display: "grid", gap: 6 }}>
              <div style={{ fontWeight: 800, letterSpacing: 0.3 }}>
                {e.type}{" "}
                <span style={{ opacity: 0.75, fontWeight: 600 }}>
                  · {e.severity}
                </span>
              </div>
              <div style={{ opacity: 0.8 }}>{e.message}</div>
              <div style={{ opacity: 0.65, fontSize: 13 }}>
                {new Date(e.created_at).toLocaleString()} · project: {e.project_id} · id: {e.id}
              </div>
            </div>

            {e.meta && (
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
                {JSON.stringify(e.meta, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}