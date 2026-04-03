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

    const interval = window.setInterval(() => {
      void load();
    }, 10000);

    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, nodeId, supabase]);

  if (!node) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-widest text-slate-300">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
        Nodo: Desconectado
      </div>
    );
  }

  const status = node.status.toLowerCase();
  const isCloud =
    node.id === "hocker-agi" ||
    node.id.startsWith("cloud-") ||
    node.id.startsWith("trigger-");

  const isOnline = isCloud || status === "online";

  const containerClass = isCloud
    ? "border-sky-400/20 bg-sky-500/10 text-sky-200"
    : isOnline
      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
      : "border-rose-400/20 bg-rose-500/10 text-rose-200";

  const dotClass = isCloud
    ? "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)] animate-pulse"
    : isOnline
      ? "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse"
      : "bg-rose-400 shadow-[0_0_8px_rgba(248,113,113,0.6)]";

  const label = isCloud ? "Núcleo AGI" : node.name ?? "En línea";

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest shadow-sm ${containerClass}`}
      title={`Última señal: ${relative(node.last_seen_at)}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
      <span className="truncate max-w-[120px]">{label}</span>
    </div>
  );
}