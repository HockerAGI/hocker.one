"use client";

import React, { useEffect, useMemo, useState } from "react";
import PageShell from "@/components/PageShell";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import { useWorkspace } from "@/components/WorkspaceContext";
import Hint from "@/components/Hint";

type Controls = { kill_switch: boolean; allow_write: boolean; updated_at: string | null };
type NodeRow = { id: string; status: string; last_seen_at: string | null; meta: any; name?: string | null };
type CmdRow = { id: string; command: string; status: string; node_id: string | null; created_at: string; error: string | null; needs_approval: boolean };
type EvtRow = { id: string; level: "info" | "warn" | "error"; type: string; message: string; created_at: string };

function pill(level: string) {
  if (level === "error") return "border-red-200 bg-red-50 text-red-800";
  if (level === "warn") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export default function DashboardPage() {
  const sb = useMemo(() => createBrowserSupabase(), []);
  const { projectId: pid } = useWorkspace();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [controls, setControls] = useState<Controls | null>(null);
  const [nodes, setNodes] = useState<NodeRow[]>([]);
  const [cmds, setCmds] = useState<CmdRow[]>([]);
  const [events, setEvents] = useState<EvtRow[]>([]);

  async function load() {
    setErr(null);
    setLoading(true);
    try {
      const [c1, c2, c3, c4] = await Promise.all([
        sb.from("system_controls").select("kill_switch,allow_write,updated_at").eq("project_id", pid).eq("id", "global").maybeSingle(),
        sb.from("nodes").select("id,status,last_seen_at,meta,name").eq("project_id", pid).order("last_seen_at", { ascending: false }).limit(50),
        sb.from("commands").select("id,command,status,node_id,created_at,error,needs_approval").eq("project_id", pid).order("created_at", { ascending: false }).limit(40),
        sb.from("events").select("id,level,type,message,created_at").eq("project_id", pid).order("created_at", { ascending: false }).limit(15),
      ]);

      if (c1.error) throw c1.error;
      if (c2.error) throw c2.error;
      if (c3.error) throw c3.error;
      if (c4.error) throw c4.error;

      setControls((c1.data as any) ?? { kill_switch: false, allow_write: false, updated_at: null });
      setNodes((c2.data as any) ?? []);
      setCmds((c3.data as any) ?? []);
      setEvents((c4.data as any) ?? []);
    } catch (e: any) {
      setErr(e?.message ?? "No pude cargar el panel.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pid]);

  return (
    <PageShell
      title="Panel"
      subtitle={`Telemetría real (Supabase). Proyecto activo: ${pid}`}
      actions={
        <button
          onClick={load}
          disabled={loading}
          className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? "Cargando…" : "Recargar"}
        </button>
      }
    >
      <Hint title="Lo que importa">
        Si algo “se siente raro”, revisa primero <b>Seguridad</b> y luego la <b>Cola de acciones</b>.
      </Hint>

      {err ? (
        <div className="mb-6 mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {err}
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="hocker-card p-5">
          <div className="text-sm font-semibold text-slate-600">Seguridad</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className={"inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold " + (controls?.kill_switch ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800")}>
              Kill Switch: {controls?.kill_switch ? "ON" : "OFF"}
            </span>
            <span className={"inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold " + (controls?.allow_write ? "border-blue-200 bg-blue-50 text-blue-800" : "border-slate-200 bg-slate-50 text-slate-700")}>
              Escritura: {controls?.allow_write ? "ON" : "OFF"}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {controls?.updated_at ? `Última actualización: ${new Date(controls.updated_at).toLocaleString()}` : "Sin registro de actualización."}
          </div>
          <a href="/governance" className="mt-4 inline-flex text-sm font-semibold text-blue-700 hover:underline">Abrir Seguridad →</a>
        </div>

        <div className="hocker-card p-5">
          <div className="text-sm font-semibold text-slate-600">Nodos</div>
          <div className="mt-3 space-y-2">
            {(nodes ?? []).slice(0, 5).map((n) => (
              <div key={n.id} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                <div className="font-semibold text-slate-900">{n.name || n.id}</div>
                <div className="text-xs text-slate-500">Estado: {n.status} · {n.last_seen_at ? new Date(n.last_seen_at).toLocaleString() : "—"}</div>
              </div>
            ))}
            {nodes.length === 0 && !loading ? <div className="text-sm text-slate-500">Sin nodos aún.</div> : null}
          </div>
          <a href="/nodes" className="mt-4 inline-flex text-sm font-semibold text-blue-700 hover:underline">Ver Nodos →</a>
        </div>

        <div className="hocker-card p-5">
          <div className="text-sm font-semibold text-slate-600">Acciones</div>
          <div className="mt-3 space-y-2">
            {(cmds ?? []).slice(0, 5).map((c) => (
              <div key={c.id} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
                <div className="font-semibold text-slate-900 truncate">{c.command}</div>
                <div className="text-xs text-slate-500">Estado: {c.status} · Nodo: {c.node_id ?? "—"}</div>
              </div>
            ))}
            {cmds.length === 0 && !loading ? <div className="text-sm text-slate-500">Sin acciones aún.</div> : null}
          </div>
          <a href="/commands" className="mt-4 inline-flex text-sm font-semibold text-blue-700 hover:underline">Abrir Acciones →</a>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="hocker-card p-5">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-lg font-bold">Eventos recientes</div>
              <div className="hocker-muted">Lo último que registró el sistema.</div>
            </div>
            <a href="/governance" className="text-sm font-semibold text-blue-700 hover:underline">Seguridad</a>
          </div>

          <div className="mt-4 space-y-3">
            {events.length === 0 && !loading ? <div className="text-sm text-slate-500">Aún no hay eventos.</div> : null}
            {events.map((e) => (
              <div key={e.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-900">{e.message}</div>
                    <div className="mt-0.5 text-xs text-slate-500">
                      {new Date(e.created_at).toLocaleString()} · <span className="font-semibold">{e.type}</span>
                    </div>
                  </div>
                  <span className={`inline-flex w-max items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${pill(e.level)}`}>
                    {e.level}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="hocker-card p-5">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-lg font-bold">Acciones recientes</div>
              <div className="hocker-muted">Últimas solicitudes (con estado real).</div>
            </div>
            <a href="/commands" className="text-sm font-semibold text-blue-700 hover:underline">Ver cola</a>
          </div>

          <div className="mt-4 space-y-3">
            {cmds.length === 0 && !loading ? <div className="text-sm text-slate-500">Aún no hay acciones.</div> : null}
            {cmds.map((c) => (
              <div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-slate-900">{c.command}</div>
                    <div className="mt-0.5 text-xs text-slate-500">{new Date(c.created_at).toLocaleString()} · Nodo: {c.node_id ?? "—"}</div>
                    {c.error ? (
                      <div className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">{c.error}</div>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    {c.needs_approval ? (
                      <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                        requiere aprobación
                      </span>
                    ) : null}
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                      {c.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}