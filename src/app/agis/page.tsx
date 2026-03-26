"use client";

import React, { useEffect, useMemo, useState } from "react";
import AppNav from "@/components/AppNav";
import { createBrowserSupabase } from "@/lib/supabase-browser";

type AgiRow = {
  id: string;
  name: string;
  description: string | null;
  version: string | null;
  tags: string[];
  meta: any;
  created_at: string;
};

export default function AgisPage() {
  const sb = useMemo(() => createBrowserSupabase(), []);
  const [rows, setRows] = useState<AgiRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    setMsg("");
    const { data, error } = await sb
      .from("agis")
      .select("id, name, description, version, tags, meta, created_at")
      .order("created_at", { ascending: true });

    if (error) {
      setMsg(error.message);
      setRows([]);
      setLoading(false);
      return;
    }

    setRows((data as any) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) =>
      [r.id, r.name, r.description ?? "", r.version ?? "", JSON.stringify(r.tags ?? []), JSON.stringify(r.meta ?? {})]
        .join(" ")
        .toLowerCase()
        .includes(s)
    );
  }, [rows, q]);

  return (
    <div className="min-h-screen bg-hocker-900 text-slate-200">
      <AppNav />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Mente Colmena AGI</h1>
            <p className="mt-1 text-sm text-slate-400">Registry global de inteligencias y perfiles operativos.</p>
          </div>
          <div className="w-full md:w-80">
            <label className="text-xs font-semibold text-slate-400">Buscar</label>
            <input
              className="mt-1 w-full rounded-xl border border-hocker-800 bg-hocker-800/50 px-4 py-2 text-sm text-white focus:border-hocker-cyan focus:outline-none"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="ID, nombre, tags, meta..."
            />
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-slate-400">Cargando sinapsis de la matriz...</div>
        ) : msg ? (
          <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200">{msg}</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-hocker-800 p-8 text-center text-slate-400">
            No se detectaron AGIs. Ejecuta `seedAgis.ts` en nova.agi.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((agi) => {
              const tags: string[] = agi.tags || [];
              const isCore = Number(agi.meta?.level ?? 0) === 1;

              return (
                <div
                  key={agi.id}
                  className={`relative overflow-hidden rounded-2xl border p-5 transition-all ${
                    isCore ? "border-hocker-blue/50 bg-hocker-blue/10" : "border-hocker-800 bg-hocker-800/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl font-bold text-xl ${
                        isCore ? "bg-hocker-blue text-white shadow-[0_0_15px_rgba(14,165,255,0.5)]" : "bg-hocker-800 text-slate-300"
                      }`}
                    >
                      {agi.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{agi.name}</h3>
                      <p className="text-xs font-medium text-hocker-cyan">{agi.version || "v1.0.0"}</p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm text-slate-300">{agi.description || "Sin descripción."}</p>

                  <div className="mt-4 flex flex-wrap gap-1">
                    {tags.map((tag) => (
                      <span key={tag} className="rounded-md border border-hocker-800 bg-hocker-900 px-2 py-1 text-[10px] uppercase text-slate-400">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                    <span>Nivel: {agi.meta?.level ?? "—"}</span>
                    <span>{new Date(agi.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}