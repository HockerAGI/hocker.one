"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { useWorkspace } from "@/components/WorkspaceContext";
import type { AgiRow } from "@/lib/types";

export default function AgisRegistry({ title = "Células Operativas" }: { title?: string }) {
  const sb = useMemo(() => createBrowserSupabase(), []);
  const { projectId } = useWorkspace();

  const [agents, setAgents] = useState<AgiRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load(): Promise<void> {
      setLoading(true);
      const { data, error } = await sb
        .from("agis")
        .select("id, name, description, version, tags, meta, created_at")
        .order("created_at", { ascending: false });

      if (!active) return;

      if (error) {
        setAgents([]);
      } else {
        setAgents((data ?? []) as AgiRow[]);
      }

      setLoading(false);
    }

    void load();
    return () => {
      active = false;
    };
  }, [projectId, sb]);

  return (
    <section className="flex h-full flex-col">
      <div className="mb-6 flex items-center justify-between px-2">
        <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-sky-400">{title}</h3>
        <div className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          <div className="text-[10px] text-slate-500 animate-pulse">Escaneando AGIs...</div>
        ) : agents.length === 0 ? (
          <div className="text-[10px] text-slate-600">No hay AGIs registradas en este sector.</div>
        ) : (
          agents.map((agi) => (
            <article
              key={agi.id}
              className="hocker-panel-pro border-white/5 p-4 transition-all hover:border-sky-500/30"
            >
              <div className="flex items-start justify-between">
                <span className="text-sm font-black text-white">{agi.name ?? agi.id}</span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-400">
                  activo
                </span>
              </div>

              <p className="mt-2 text-[11px] text-slate-400">
                {agi.description ?? "AGI de registro."}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}