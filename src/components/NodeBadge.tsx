"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import type { NodeRow } from "@/lib/types";
import { useWorkspace } from "@/components/WorkspaceContext";

export default function NodeBadge() {
  const sb = useMemo(() => createBrowserSupabase(), []);
  const { projectId: pid, nodeId: nid } = useWorkspace();
  const [node, setNode] = useState<NodeRow | null>(null);

  async function check() {
    try {
      const { data } = await sb
        .from("nodes")
        .select("*")
        .eq("project_id", pid)
        .eq("id", nid)
        .maybeSingle();
      if (data) setNode(data as NodeRow);
      else setNode(null);
    } catch {
      setNode(null);
    }
  }

  useEffect(() => {
    check();
    const t = setInterval(check, 10000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid, nid]);

  if (!node) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
        <span className="h-2 w-2 rounded-full bg-slate-300" />
        Nodo: no detectado
      </div>
    );
  }

  const isCloud = node.meta?.engine === "trigger.dev" || node.id.startsWith("cloud-") || node.id === "hocker-fabric";
  const isOnline = node.status === "online" || isCloud;

  return (
    <div
      className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
        isCloud
          ? "border-blue-200 bg-blue-50 text-blue-800"
          : isOnline
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-800"
      }`}
      title={node.last_seen_at ? `Último latido: ${node.last_seen_at}` : "Sin latido"}
    >
      <span className={`h-2 w-2 rounded-full ${isCloud ? "bg-blue-500" : isOnline ? "bg-emerald-500" : "bg-red-500"}`} />
      {isCloud ? "Fabric" : "On-Prem"}: {node.name || node.id}
    </div>
  );
}
