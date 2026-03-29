"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { useWorkspace } from "@/components/WorkspaceContext";

type NodeRow = {
  id: string;
  project_id: string;
  name: string | null;
  status: string;
  last_seen_at: string | null;
  meta: any;
};

function relative(ts: string | null) {
  if (!ts) return "—";
  const diff = Math.max(0, Date.now() - new Date(ts).getTime());
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function NodeBadge() {
  const sb = useMemo(() => createBrowserSupabase(), []);
  const { projectId, nodeId } = useWorkspace();
  const [node, setNode] = useState<NodeRow | null>(null);

  async function load() {
    try {
      const { data } = await sb
        .from("nodes")
        .select("id,project_id,name,status,last_seen_at,meta")
        .eq("project_id", projectId)
        .eq("id", nodeId)
        .maybeSingle();

      setNode((data as any) ?? null);
    } catch {
      setNode(null);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [projectId, nodeId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!node) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-500 shadow-sm backdrop-blur-md">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
        Nodo: Desconectado
      </div>
    );
  }

  const status = String(node.status || "").toLowerCase();
  const isCloud =
    node.id === "hocker-fabric" || node.id.startsWith("cloud-") || node.id.startsWith("trigger-");
  const ok = isCloud || status === "online";

  // Estilos Ring-Inset de alta gama para la insignia
  const getBadgeStyle = () => {
    if (isCloud) return {
      container: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20",
      dot: "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse"
    };
    if (ok) return {
      container: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20",
      dot: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse"
    };
    return {
      container: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20",
      dot: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
    };
  };

  const style = getBadgeStyle();

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest shadow-sm transition-all ${style.container}`}
      title={`Última señal: ${relative(node.last_seen_at)}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      <span className="truncate max-w-[120px]">
        {isCloud ? "Nube Central" : node.name || "En línea"}
      </span>
    </div>
  );
}
