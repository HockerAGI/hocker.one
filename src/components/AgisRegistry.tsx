use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { useWorkspace } from "@/components/WorkspaceContext";

type AgiRow = {
  id: string;
  name: string | null;
  description: string | null;
  version: string | null;
  tags: string[];
  meta: any;
  created_at: string;
};

export default function AgisRegistry() {
  const sb = useMemo(() => createBrowserSupabase(), []);
  const { projectId } = useWorkspace();
  const [items, setItems] = useState<AgiRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await sb
        .from("agis")
        .select("id, name, description, version, tags, meta, created_at")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setItems((data as AgiRow[]) ?? []);
    } catch (e: any) {
      setError(e?.message ?? "No se pudo cargar el catálogo de agentes.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">Agentes IA</div>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
            Catálogo de inteligencias del ecosistema
          </h2>
        </div>
        <button
          type="button"
          onClick={load}
          className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Actualizar
        </button>
      </div>

      <div className="mt-4 text-sm text-slate-600">
        Proyecto activo: <span className="font-semibold text-slate-900">{projectId}</span>
      </div>

      <div className="mt-5">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            Cargando agentes...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-6 text-sm text-amber-900">
            {error}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
            No hay agentes registrados todavía.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {items.map((agi) => (
              <div key={agi.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <div className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
                  {agi.version || "sin versión"}
                </div>
                <div className="mt-2 text-lg font-black tracking-tight text-slate-950">
                  {agi.name || agi.id}
                </div>
                <div className="mt-2 text-sm leading-6 text-slate-600">
                  {agi.description || "Sin descripción disponible."}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(agi.tags || []).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                {agi.meta && Object.keys(agi.meta || {}).length > 0 ? (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-semibold text-slate-700">
                      Ver metadatos
                    </summary>
                    <pre className="mt-2 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-emerald-200">
                      {JSON.stringify(agi.meta, null, 2)}
                    </pre>
                  </details>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

