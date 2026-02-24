"use client";

import { useEffect, useState, useMemo } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { defaultNodeId, defaultProjectId, normalizeNodeId, normalizeProjectId } from "@/lib/project";
import type { NodeRow } from "@/lib/types";

export default function NodeBadge() {
  const sb = useMemo(() => createBrowserSupabase(), []);
  const [node, setNode] = useState<NodeRow | null>(null);

  const pid = normalizeProjectId(defaultProjectId());
  const nid = normalizeNodeId(defaultNodeId());

  async function check() {
    try {
      const { data } = await sb
        .from("nodes")
        .select("*")
        .eq("project_id", pid)
        .eq("id", nid)
        .maybeSingle();
      if (data) setNode(data as NodeRow);
    } catch {}
  }

  useEffect(() => {
    check();
    const t = setInterval(check, 10000); // Polling muy ligero
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid, nid]);

  if (!node) {
    return (
      <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-500 shadow-sm">
        <div className="h-2 w-2 rounded-full bg-slate-300"></div>
        Buscando Matriz...
      </div>
    );
  }

  // Lógica Hocker Fabric: Detectar si es un nodo de nube/Trigger.dev
  const isCloud = node.meta?.engine === "trigger.dev" || node.id.startsWith("cloud-") || node.id === "hocker-fabric";
  const isOnline = node.status === "online" || isCloud; // Los nodos cloud siempre se asumen listos para recibir webhooks

  return (
    <div
      className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium shadow-sm transition-colors ${
        isCloud
          ? "border-blue-200 bg-blue-50 text-blue-800"
          : isOnline
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-800"
      }`}
      title={isCloud ? "Conectado a Hocker Automation Fabric (Nube)" : `Último latido: ${node.last_seen_at}`}
    >
      <div className="relative flex h-2 w-2 items-center justify-center">
        {isOnline && (
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${isCloud ? "bg-blue-400" : "bg-emerald-400"}`}></span>
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${isCloud ? "bg-blue-500" : isOnline ? "bg-emerald-500" : "bg-red-500"}`}></span>
      </div>
      
      <span className="hidden md:inline-block">
        {isCloud ? "Fabric Node:" : "On-Premise:"} <span className="font-bold">{node.name || node.id}</span>
      </span>
      <span className="inline-block md:hidden font-bold">
        {isCloud ? "FABRIC" : isOnline ? "ONLINE" : "OFFLINE"}
      </span>
    </div>
  );
}