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

function isNodeRow(data: unknown): data is NodeRow {
  if (typeof data !== "object" || data === null) return false;

  const obj = data as Record<string, unknown>;

  return (
    typeof obj.id === "string" &&
    typeof obj.project_id === "string" &&
    (typeof obj.name === "string" || obj.name === null) &&
    typeof obj.status === "string" &&
    (typeof obj.last_seen_at === "string" || obj.last_seen_at === null) &&
    (typeof obj.meta === "object" || obj.meta === null)
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
        .