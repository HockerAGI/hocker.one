"use client";

import { createBrowserSupabase } from "@/lib/supabase-browser";
import { useWorkspace } from "@/components/WorkspaceContext";
import { useEffect, useState } from "react";

type Item = {
  id: string;
  command: string;
};

export default function CommandApprovalPanel() {
  const { projectId } = useWorkspace();
  const sb = createBrowserSupabase();

  const [items, setItems] = useState<Item[]>([]);

  async function load() {
    const { data } = await sb
      .from("commands")
      .select("id,command")
      .eq("project_id", projectId)
      .eq("status", "needs_approval");

    setItems(data ?? []);
  }

  async function approve(id: string) {
    await sb
      .from("commands")
      .update({ status: "queued", approved_at: new Date().toISOString() })
      .eq("id", id);

    load();
  }

  useEffect(() => {
    load();
  }, [projectId]);

  return (
    <section className="hocker-panel-pro p-5">
      <h3 className="text-[11px] font-black uppercase text-amber-400">
        Aprobaciones
      </h3>

      <div className="mt-3 space-y-2">
        {items.map((i) => (
          <div key={i.id} className="flex justify-between text-xs">
            <span>{i.command}</span>
            <button onClick={() => approve(i.id)}>OK</button>
          </div>
        ))}
      </div>
    </section>
  );
}