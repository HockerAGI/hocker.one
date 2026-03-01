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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, nodeId]);

  if (!node) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
        <span className="h-2 w-2 rounded-full bg-slate-300" />
        Nodo: no detectado
      </div>
    );
  }

  const s = String(node.status || "").toLowerCase();
  const isCloud = node.id === "hocker-fabric" || node.id.startsWith("cloud-") || node.id.startsWith("trigger-");
  const ok = isCloud || s === "online";

  const cls = isCloud
    ? "border-blue-200 bg-blue-50 text-blue-800"
    : ok
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : "border-red-200 bg-red-50 text-red-800";

  return (
    <div className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${cls}`}>
      <span className={`h-2 w-2 rounded-full ${isCloud ? "bg-blue-500" : ok ? "bg-emerald-500" : "bg-red-500"}`} />
      {isCloud ? "Fabric" : "Nodo"}: {node.name || node.id}
    </div>
  );
}