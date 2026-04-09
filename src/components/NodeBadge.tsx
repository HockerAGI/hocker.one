"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

function statusChip(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized === "online") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-300 shadow-[0_0_18px_rgba(52,211,153,0.12)]";
  }

  if (normalized === "degraded") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-300 shadow-[0_0_18px_rgba(245,158,11,0.12)]";
  }

  return "border-slate-500/20 bg-white/[0.04] text-slate-300";
}

export default function NodeBadge() {
  const supabase = useMemo(() => createBrowserSupabase(), []);
  const { projectId, nodeId } = useWorkspace();
  const [node, setNode] = useState<NodeRow | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (): Promise<void> => {
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
    } finally {
      setLoading(false);
    }
  }, [nodeId, projectId, supabase]);

  useEffect(() => {
    void load();
    const interval = window.setInterval(() => void load(), 10000);
    return () => window.clearInterval(interval);
  }, [load]);

  const status = node?.status?.toLowerCase?.() ?? "offline";
  const online = status === "online" || status === "degraded";
  const label = node?.id === "hocker-agi" ? "Núcleo AGI" : node?.name ?? "Nodo";
  const meta = node?.meta && typeof node.meta === "object" && !Array.isArray(node.meta) ? node.meta : {};

  return (
    <article className="rounded-[28px] border border-white/5 bg-white/[0.03] p-4 shadow-[0_12px_50px_rgba(2,6,23,0.18)] backdrop-blur-2xl">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.35em] text-sky-400">
            Nodo actual
          </p>
          <h3 className="mt-2 truncate text-base font-black text-white sm:text-lg font-display">
            {label}
          </h3>
          <p className="mt-1 text-[11px] text-slate-500">
            {nodeId || "Sin nodo asignado"}
          </p>
        </div>

        <span
          className={[
            "shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.3em]",
            statusChip(status),
          ].join(" ")}
        >
          {loading ? "..." : online ? "En línea" : "Offline"}
        </span>
      </div>

      <div className="mt-4 rounded-[22px] border border-white/5 bg-slate-950/45 p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[9px] font-black uppercase tracking-[0.32em] text-slate-500">
            Última señal
          </span>
          <span className="text-[10px] font-mono uppercase text-slate-400">
            {relative(node?.last_seen_at ?? null)}
          </span>
        </div>

        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/50">
          <div
            className={[
              "h-full rounded-full transition-all duration-500",
              online
                ? "bg-sky-500 shadow-[0_0_10px_#0ea5ff]"
                : "bg-slate-600",
            ].join(" ")}
            style={{ width: online ? "100%" : "18%" }}
          />
        </div>
      </div>

      {Object.keys(meta).length > 0 ? (
        <details className="mt-4">
          <summary className="cursor-pointer list-none text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 transition-colors hover:text-sky-400">
            Inspeccionar datos
          </summary>
          <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-slate-950/80 shadow-inner">
            <pre className="overflow-auto p-4 font-mono text-[11px] leading-relaxed text-emerald-300 custom-scrollbar">
              {JSON.stringify(meta, null, 2)}
            </pre>
          </div>
        </details>
      ) : null}
    </article>
  );
}