"use client";

import { useEffect, useCallback, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { getErrorMessage } from "@/lib/errors";

export default function CommandsQueue() {
  const sb = useMemo(() => createBrowserSupabase(), []);

  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await sb
        .from("commands")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      setItems((data as Record<string, unknown>[]) || []);
    } catch (err) {
      console.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [sb]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && items.length === 0) {
    return <div className="p-4 text-xs text-slate-500 animate-pulse">Sincronizando cola de comandos...</div>;
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, idx) => (
        <div key={idx} className="rounded-xl border border-white/5 bg-white/5 p-3">
          <p className="text-[10px] font-mono text-sky-400">{String(item.id || idx)}</p>
          <p className="text-xs text-slate-300">{String(item.payload || "Sin contenido")}</p>
        </div>
      ))}
    </div>
  );
}
