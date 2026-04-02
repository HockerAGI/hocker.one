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
  meta: Record<string, unknown> | null;
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

      if (
  data &&
  typeof data.id === "string" &&
  typeof data.project_id === "string"
) {
  setNode(data as NodeRow);
} else {
  setNode(null);
}
    } catch {
      setNode(null);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, nodeId]);

  if (!node) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-widest text-slate-300">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
        Nodo: Desconectado
      </div>
    );
  }

  const status = String(node.status || "").toLowerCase();
  const isCloud = node.id === "hocker-fabric" || node.id.startsWith("cloud-") || node.id.startsWith("trigger-");
  const ok = isCloud || status === "online";

  const classes = isCloud
    ? "border-sky-400/20 bg-sky-500/10 text-sky-200"
    : ok
      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
      : "border-rose-400/20 bg-rose-500/10 text-rose-200";

  const dot = isCloud
    ? "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)] animate-pulse"
    : ok
      ? "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse"
      : "bg-rose-400 shadow-[0_0_8px_rgba(248,113,113,0.6)]";

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest shadow-sm ${classes}`}
      title={`Última señal: ${relative(node.last_seen_at)}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      <span className="truncate max-w-[120px]">{isCloud ? "Nube Central" : node.name || "En línea"}</span>
    </div>
  );
}