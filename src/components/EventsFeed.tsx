"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { defaultProjectId, normalizeProjectId } from "@/lib/project";

type Row = {
  id: string;
  project_id: string;
  level: "info" | "warn" | "error";
  message: string;
  created_at: string;
};

export default function EventsFeed() {
  const sb = useMemo(() => createBrowserSupabase(), []);
  const [projectId, setProjectId] = useState(defaultProjectId());
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [manualText, setManualText] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("hocker_project_id");
      if (stored) setProjectId(normalizeProjectId(stored));
    } catch {}
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setErr(null);
      const { data, error } = await sb
        .from("events")
        .select("id,project_id,level,message,created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(30);

      if (cancelled) return;
      if (error) setErr(error.message);
      else setRows((data ?? []) as any);
    }

    load();
    const t = setInterval(load, 2500);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [sb, projectId]);

  async function createManual() {
    setErr(null);
    const text = manualText.trim();
    if (!text) return;

    const r = await fetch("/api/events/manual", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ project_id: projectId, level: "info", message: text })
    });

    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      setErr(j?.error ?? "Error creando evento");
      return;
    }
    setManualText("");
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-semibold">Eventos</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs opacity-70">Project</span>
          <input
            className="rounded border px-3 py-2 text-sm"
            value={projectId}
            onChange={(e) => setProjectId(normalizeProjectId(e.target.value))}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 rounded border px-3 py-2"
          value={manualText}
          onChange={(e) => setManualText(e.target.value)}
          placeholder="Crear evento manual (admin/owner)…"
        />
        <button className="rounded bg-black text-white px-4" onClick={createManual}>
          Enviar
        </button>
      </div>

      {err && <div className="text-sm text-red-600">{err}</div>}

      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="rounded border p-3">
            <div className="flex items-center justify-between text-xs opacity-70">
              <span>{r.level.toUpperCase()}</span>
              <span>{new Date(r.created_at).toLocaleString()}</span>
            </div>
            <div className="mt-1">{r.message}</div>
          </div>
        ))}
        {rows.length === 0 && <div className="opacity-60 text-sm">Sin eventos</div>}
      </div>
    </div>
  );
}