"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { getErrorMessage } from "@/lib/errors";

export default function CommandsQueue() {
  const sb = useMemo(() => createBrowserSupabase(), []);

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const { data } = await sb
        .from("commands")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      setItems(data || []);
    } catch (err) {
      console.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();

    const ch = sb.channel("live")
      .on("postgres_changes", { event: "*", schema: "public", table: "commands" }, load)
      .subscribe();

    return () => {
      sb.removeChannel(ch);
    };
  }, []);

  return (
    <section className="hocker-panel-pro h-full flex flex-col">
      <div className="p-5 border-b border-white/5">
        <h3 className="text-xs font-black text-sky-400">COMMAND LOG</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="text-xs text-slate-500">Loading...</div>
        ) : (
          items.map((c) => (
            <div key={c.id} className="text-xs border p-3 rounded-xl">
              <div className="flex justify-between">
                <span>{c.command}</span>
                <span>{c.status}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}