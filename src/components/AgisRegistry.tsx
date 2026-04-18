"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { useWorkspace } from "@/components/WorkspaceContext";
import type { AgiRow, JsonObject } from "@/lib/types";
import { getErrorMessage } from "@/lib/errors";

type Props = {
  title?: string;
};

function asMeta(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
}

function loadPercent(meta: JsonObject): string {
  const raw = meta.load;
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return `${Math.max(0, Math.min(100, raw))}%`;
  }
  return "0%";
}

function safeDate(input: string): string {
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("es-MX");
}

export default function AgisRegistry({ title = "Equipo activo" }: Props) {
  const sb = useMemo(() => createBrowserSupabase(), []);
  const { projectId } = useWorkspace();

  const [agents, setAgents] = useState<AgiRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load(): Promise<void> {
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await sb
        .from("agis")
        .select("id, name, description, version, tags, meta, created_at")
        .order("created_at", { ascending: false })
        .limit(100);

      if (queryError) throw queryError;

      setAgents((data ?? []) as AgiRow[]);
    } catch (err: unknown) {
      setAgents([]);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [projectId, sb]);

  return (
    <section className="flex h-full flex-col">
      <div className="mb-5 flex items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-sky-400">
            Equipo
          </p>
          <h3 className="mt-2 text-lg font-black text-white sm:text-xl">{title}</h3>
        </div>

        <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[9px] font-black uppercase tracking-widest text-slate-300">
          {agents.length} activas
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          <div className="animate-pulse text-[10px] text-slate-500">
            Escaneando módulos...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-[11px] leading-relaxed text-rose-300">
            {error}
          </div>
        ) : agents.length === 0 ? (
          <div className="text-[10px] text-slate-600">No hay módulos registrados aquí.</div>
        ) : (
          agents.map((agi) => {
            const meta = asMeta(agi.meta);
            const percent = loadPercent(meta);

            return (
              <article
                key={agi.id}
                className="group hocker-panel-pro border-white/5 p-4 transition-all hover:border-sky-500/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="block truncate text-sm font-black text-white group-hover:text-sky-300">
                      {agi.name ?? agi.id}
                    </span>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                      {agi.description ?? "Módulo activo."}
                    </p>
                  </div>

                  <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-400">
                    activo
                  </span>
                </div>

                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">Nivel</span>
                    <span className="text-sky-400">{percent}</span>
                  </div>

                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/50">
                    <div
                      className="h-full rounded-full bg-sky-500 shadow-[0_0_10px_#0ea5ff]"
                      style={{ width: percent }}
                    />
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                        Versión
                      </p>
                      <p className="mt-1 text-xs text-slate-100">{agi.version ?? "—"}</p>
                    </div>
                    <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                        Creada
                      </p>
                      <p className="mt-1 text-xs text-slate-100">{safeDate(agi.created_at)}</p>
                    </div>
                  </div>

                  {agi.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {agi.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[9px] uppercase tracking-wider text-slate-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {Object.keys(meta).length > 0 ? (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 transition-colors hover:text-sky-400">
                        Ver detalles
                      </summary>
                      <pre className="mt-2 overflow-auto rounded-xl border border-white/10 bg-slate-950/80 p-4 font-mono text-[11px] leading-relaxed text-emerald-300 custom-scrollbar">
                        {JSON.stringify(meta, null, 2)}
                      </pre>
                    </details>
                  ) : null}
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}