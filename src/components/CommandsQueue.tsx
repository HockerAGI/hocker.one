"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { getErrorMessage } from "@/lib/errors";
import { useWorkspace } from "@/components/WorkspaceContext";
import type { CommandRow } from "@/lib/types";

type QueueItem = Pick<
  CommandRow,
  "id" | "project_id" | "node_id" | "command" | "status" | "created_at" | "payload"
>;

function isQueueItem(value: unknown): value is QueueItem {
  if (typeof value !== "object" || value === null) return false;

  const item = value as Record<string, unknown>;

  return (
    typeof item.id === "string" &&
    typeof item.project_id === "string" &&
    typeof item.command === "string" &&
    typeof item.status === "string" &&
    typeof item.created_at === "string"
  );
}

function prettyPayload(payload: QueueItem["payload"]): string {
  try {
    return JSON.stringify(payload ?? {}, null, 2);
  } catch {
    return "{}";
  }
}

export default function CommandsQueue() {
  const sb = useMemo(() => createBrowserSupabase(), []);
  const { projectId } = useWorkspace();

  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await sb
        .from("commands")
        .select("id, project_id, node_id, command, status, created_at, payload")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (queryError) {
        throw queryError;
      }

      const rows = Array.isArray(data) ? data.filter(isQueueItem) : [];
      setItems(rows);
    } catch (err: unknown) {
      setItems([]);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [projectId, sb]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && items.length === 0) {
    return (
      <div className="p-4 text-xs text-slate-500 animate-pulse">
        Sincronizando cola de comandos...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs text-rose-200">
        {error}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-white/5 p-4 text-xs text-slate-400">
          Sin comandos pendientes.
        </div>
      ) : (
        items.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-white/5 bg-white/5 p-4 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-mono text-sky-400">{item.command}</p>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                {item.status}
              </span>
            </div>

            <p className="mt-2 text-[11px] text-slate-400">
              {new Date(item.created_at).toLocaleString("es-MX")}
            </p>

            <pre className="mt-3 overflow-auto rounded-xl border border-white/5 bg-slate-950/70 p-3 font-mono text-[11px] leading-relaxed text-slate-300 custom-scrollbar">
              {prettyPayload(item.payload)}
            </pre>
          </article>
        ))
      )}
    </div>
  );
}