"use client";

import React, { useEffect, useState, useMemo } from "react";
import AppNav from "@/components/AppNav";
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

  async function load() {
    setLoading(true);
    const { data } = await sb
      .from("agis")
      .select("id, name, role, status, metadata")
      .eq("project_id", pid)
      .order("metadata->level", { ascending: true });
    
    setRows((data as any) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid]);

  return (
    <div className="min-h-screen bg-hocker-900 text-slate-200">
      <AppNav />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Mente Colmena AGI</h1>
            <p className="mt-1 text-sm text-slate-400">Jerarquía y estado operativo del ecosistema cognitivo.</p>
          </div>
          <div className="w-full md:w-64">
            <label className="text-xs font-semibold text-slate-400">Proyecto</label>
            <input
              className="mt-1 w-full rounded-xl border border-hocker-800 bg-hocker-800/50 px-4 py-2 text-sm text-white focus:border-hocker-cyan focus:outline-none"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-sm text-slate-400">Cargando sinapsis de la matriz...</div>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-hocker-800 p-8 text-center text-slate-400">
            No se detectaron AGIs. Asegúrate de ejecutar el script `seedAgis.ts` en nova.agi.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((agi) => {
              const tags: string[] = agi.metadata?.tags || [];
              const isGhost = tags.includes("invisible") || tags.includes("stealth") || tags.includes("ghost");
              const isCore = agi.metadata?.level === 1;

              return (
                <div key={agi.id} className={`relative overflow-hidden rounded-2xl border p-5 transition-all ${isCore ? 'border-hocker-blue/50 bg-hocker-blue/10' : 'border-hocker-800 bg-hocker-800/30'}`}>
                  {isGhost && (
                    <div className="absolute -right-6 top-4 rotate-45 bg-slate-700/50 px-8 py-1 text-[10px] font-bold tracking-widest text-slate-300 backdrop-blur-md">
                      STEALTH
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl font-bold text-xl ${isCore ? 'bg-hocker-blue text-white shadow-[0_0_15px_rgba(14,165,255,0.5)]' : 'bg-hocker-800 text-slate-300'}`}>
                      {agi.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">{agi.name}</h3>
                      <p className="text-xs font-medium text-hocker-cyan">{agi.role.toUpperCase()}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex flex-wrap gap-1">
                    {tags.map((tag) => (
                      <span key={tag} className="rounded-md bg-hocker-900 px-2 py-1 text-[10px] uppercase text-slate-400 border border-hocker-800">
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                    <span>Nivel Jerárquico: {agi.metadata?.level}</span>
                    <span className="flex items-center gap-1">
                      <div className={`h-2 w-2 rounded-full ${agi.status === 'active' || agi.status === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-slate-600'}`}></div>
                      {agi.status}
                    </span>
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