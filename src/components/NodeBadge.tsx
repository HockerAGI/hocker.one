"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import type { NodeRow } from "@/lib/types";
import { useWorkspace } from "@/components/WorkspaceContext";

export default function NodeBadge() {
  const sb = useMemo(() => createBrowserSupabase(), []);
  const ws = useWorkspace();
  const [node, setNode] = useState<NodeRow | null>(null);

  async function check() {
    try {
      const { data, error } = await sb
        .from("nodes")
        .select("id,project_id,name,type,status,last_seen_at,meta,created_at,updated_at")
        .eq("project_id", ws.projectId)
        .eq("id", ws.nodeId)
        .maybeSingle();

      if (!error) setNode((data as any) ?? null);
    } catch {
      setNode(null);
    }
  }

  useEffect(() => {
    check();
    const t = setInterval(check, 10000);
    return () => clearInterval(t);
  }, [ws.projectId, ws.nodeId]);

  if (!node) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-500 shadow-sm">
        <div className="h-2 w-2 rounded-full bg-slate-300" />
        Nodo: {ws.nodeId}
      </div>
    );
  }

  const metaEngine = String((node as any).meta?.engine || "");
  const isCloud = node.id === "hocker-fabric" || metaEngine.includes("fabric") || node.id.startsWith("cloud-") || node.id.startsWith("trigger-");
  const isOnline = String(node.status || "").toLowerCase() === "online";

  return (
    <div
      className={
        "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm transition-colors " +
        (isCloud
          ? "border-blue-200 bg-blue-50 text-blue-800"
          : isOnline
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-800")
      }
      title={node.last_seen_at ? `Último latido: ${new Date(node.last_seen_at).toLocaleString()}` : "Sin latido"}
    >
      <span className={"inline-flex h-2 w-2 rounded-full " + (isCloud ? "bg-blue-500" : isOnline ? "bg-emerald-500" : "bg-red-500")} />
      <span className="truncate">
        {isCloud ? "Fabric" : "Nodo"}: <b>{node.name || node.id}</b>
      </span>
    </div>
  );
}