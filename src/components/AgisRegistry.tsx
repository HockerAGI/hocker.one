"use client";
import { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { useWorkspace } from "@/components/WorkspaceContext";

export default function AgisRegistry({ title = "Células Operativas" }) {
  const sb = createBrowserSupabase();
  const { projectId } = useWorkspace();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await sb
        .from("nodes")
        .select("*")
        .eq("project_id", projectId)
        .eq("type", "agent");
      setAgents(data || []);
      setLoading(false);
    }
    load();
  }, [projectId]);

  return (
    <section className="flex flex-col h-full">
      <div className="mb-6 flex items-center justify-between px-2">
        <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-sky-400">{title}</h3>
        <div className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
      </div>
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
        {loading ? (
          <div className="text-[10px] text-slate-500 animate-pulse">Escaneando agentes...</div>
        ) : agents.length === 0 ? (
          <div className="text-[10px] text-slate-600">No hay agentes activos en este sector.</div>
        ) : (
          agents.map((agent) => (
            <article key={agent.id} className="hocker-panel-pro p-4 border-white/5 hover:border-sky-500/30 transition-all">
              <div className="flex justify-between items-start">
                <span className="text-sm font-black text-white">{agent.name}</span>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${agent.status === 'online' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                  {agent.status}
                </span>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">{agent.meta?.desc || "Agente de red activo."}</p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
