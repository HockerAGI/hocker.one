"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { useWorkspace } from "@/components/WorkspaceContext";
import type { NodeRow } from "@/lib/types";

function isNodeRow(data: unknown): data is NodeRow {
  if (typeof data !== "object" || data === null || Array.isArray(data)) return false;

  const obj = data as Record<string, unknown>;
  return (
    typeof obj.id === "string" &&
    typeof obj.project_id === "string" &&
    (typeof obj.name === "string" || obj.name === null) &&
    typeof obj.status === "string" &&
    (typeof obj.last_seen_at === "string" || obj.last_seen_at === null)
  );
}

function relative(ts: string | null): string {
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
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const { projectId, nodeId } = useWorkspace();

  const [node, setNode] = useState<NodeRow | null>(null);

  async function load(): Promise<void> {
    try {
      if (!nodeId) {
        setNode(null);
        return;
      }

      const { data, error } = await supabase
        .from("nodes")
        .select("id, project_id, name, status, last_seen_at, meta")
        .eq("project_id", projectId)
        .eq("id", nodeId)
        .maybeSingle();

      if (error || !isNodeRow(data)) {
        setNode(null);
        return;
      }

      setNode(data);
    } catch {
      setNode(null);
    }
  }

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(), 10000);
    return () => window.clearInterval(interval);
  }, [nodeId, projectId, supabase]);

  const status = node?.status?.toLowerCase?.() ?? "offline";
  const online = status === "online" || status === "degraded";
  const label = node?.name ?? "Equipo";

  return (
    <div className="rounded-[26px] border border-white/5 bg-white/[0.03] p-4 shadow-[0_12px_50px_rgba(2,6,23,0.16)]">
      <div className="flex items-center gap-3">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            online ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.45)]" : "bg-slate-500"
          }`}
        />
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-white">{label}</p>
          <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">
            {online ? "En línea" : "Fuera"}
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-2xl border border-white/5 bg-slate-950/45 p-3">
        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
          Última señal
        </p>
        <p className="mt-1 text-xs text-slate-200">{relative(node?.last_seen_at ?? null)}</p>
      </div>
    </div>
  );
}