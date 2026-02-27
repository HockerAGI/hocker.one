"use client";

import React, { useEffect, useMemo, useState } from "react";
import PageShell from "@/components/PageShell";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { defaultProjectId, normalizeProjectId } from "@/lib/project";

type AgiRow = {
  id: string;
  name: string;
  role: string;
  status: string;
  metadata: any;
};

export default function AgisPage() {
  const sb = useMemo(() => createBrowserSupabase(), []);
  const [projectId, setProjectId] = useState(defaultProjectId());
  const pid = useMemo(() => normalizeProjectId(projectId), [projectId]);

  const [rows, setRows] = useState<AgiRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setMsg(null);
    try {
      const { data, error } = await sb
        .from("agis")
        .select("id, name, role, status, metadata")
        .eq("project_id", pid)
        .order("metadata->level", { ascending: true });

      if (error) throw error;
      setRows((data as any) ?? []);
    } catch (e: any) {
      setMsg(e?.message ?? "No pude cargar AGIs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid]);

  return (
    <PageShell
      title="Agentes IA"
      subtitle="Jerarquía y estado de los agentes (desde la tabla agis)."
      actions={
        <div className="flex items-end gap-2">
          <div className="w-56">
            <label className="text-xs font-semibold text-slate-600">Proyecto</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            />
          </div>
          <button
            onClick={load}
            className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            disabled={loading}
          >
            {loading ? "Cargando…" : "Recargar"}
          </button>
        </div>
      }
    >
      {msg ? (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {msg}
        </div>
      ) : null}

      {loading ? (
        <div className="text-sm text-slate-500">Cargando…</div>
      ) : rows.length === 0 ? (
        <div className="hocker-card p-8 text-center text-sm text-slate-600">
          No se detectaron AGIs para este proyecto.
          <div className="mt-2 text-xs text-slate-500">Tip: ejecuta el seed en <code className="hocker-kbd">nova.agi</code>.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((agi) => {
            const tags: string[] = agi.metadata?.tags || [];
            const isGhost = tags.includes("invisible") || tags.includes("stealth") || tags.includes("ghost");
            const level = Number(agi.metadata?.level ?? 0);
            const isCore = level === 1;

            return (
              <div
                key={agi.id}
                className={
                  "relative overflow-hidden rounded-2xl border p-5 transition-all " +
                  (isCore ? "border-blue-200 bg-blue-50" : "border-slate-200 bg-white")
                }
              >
                {isGhost ? (
                  <div className="absolute -right-7 top-4 rotate-45 bg-slate-900 px-10 py-1 text-[10px] font-extrabold tracking-widest text-white">
                    STEALTH
                  </div>
                ) : null}

                <div className="flex items-center gap-3">
                  <div
                    className={
                      "flex h-12 w-12 items-center justify-center rounded-2xl font-extrabold " +
                      (isCore ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-800")
                    }
                    title={`Nivel ${level || "—"}`}
                  >
                    {agi.name?.charAt(0) || "A"}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-lg font-extrabold text-slate-900">{agi.name}</div>
                    <div className="truncate text-xs font-semibold text-blue-700">{String(agi.role || "").toUpperCase()}</div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-1">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-700"
                    >
                      {tag}
                    </span>
                  ))}
                  {tags.length === 0 ? (
                    <span className="text-xs text-slate-500">Sin tags</span>
                  ) : null}
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-slate-600">
                  <span>Nivel: {level || "—"}</span>
                  <span className="inline-flex items-center gap-2">
                    <span
                      className={
                        "h-2 w-2 rounded-full " +
                        (agi.status === "active" || agi.status === "online" ? "bg-emerald-500" : "bg-slate-400")
                      }
                    />
                    {agi.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
