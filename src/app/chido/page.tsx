import type { Metadata } from "next";
import Link from "next/link";
import Hint from "@/components/Hint";
import PageShell from "@/components/PageShell";
import { createAdminSupabase } from "@/lib/supabase-admin";
import type { JsonObject } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Chido Casino · Hocker ONE",
  description: "Monitoreo read-only de Chido Casino dentro del ecosistema HOCKER.",
};

type NodeRow = {
  id: string;
  project_id: string;
  name: string | null;
  type: string | null;
  status: string | null;
  last_seen_at: string | null;
  updated_at: string | null;
  meta: JsonObject | null;
};

type EventRow = {
  id: string;
  project_id: string;
  node_id: string | null;
  level: string | null;
  type: string;
  message: string | null;
  data: JsonObject | null;
  created_at: string;
};

function safeDate(input: string | null): string {
  if (!input) return "—";
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("es-MX");
}

function statusClass(status: string | null): string {
  if (status === "online") return "border-emerald-400/20 bg-emerald-500/10 text-emerald-300";
  if (status === "degraded") return "border-amber-400/20 bg-amber-500/10 text-amber-300";
  if (status === "offline") return "border-rose-400/20 bg-rose-500/10 text-rose-300";
  return "border-slate-400/20 bg-slate-500/10 text-slate-300";
}

function asRecord(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonObject) : {};
}

function getChecks(meta: JsonObject | null): Array<{ key: string; active: boolean; detail: string }> {
  const checks = asRecord(asRecord(meta).checks);

  return Object.entries(checks).map(([key, value]) => {
    const item = asRecord(value);

    return {
      key,
      active: item.active === true,
      detail: typeof item.detail === "string" ? item.detail : "—",
    };
  });
}

async function loadChido() {
  const sb = createAdminSupabase();

  const [{ data: nodes }, { data: events }] = await Promise.all([
    sb
      .from("nodes")
      .select("id,project_id,name,type,status,last_seen_at,updated_at,meta")
      .eq("project_id", "chido-casino")
      .order("updated_at", { ascending: false })
      .limit(5),
    sb
      .from("events")
      .select("id,project_id,node_id,level,type,message,data,created_at")
      .eq("project_id", "chido-casino")
      .like("type", "chido.%")
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  return {
    nodes: (nodes ?? []) as NodeRow[],
    events: (events ?? []) as EventRow[],
  };
}

export default async function ChidoPage() {
  const { nodes, events } = await loadChido();
  const primary = nodes.find((node) => node.id === "chido-casino-web") ?? nodes[0] ?? null;
  const checks = getChecks(primary?.meta ?? null);

  const online = primary?.status === "online";
  const degraded = primary?.status === "degraded";

  return (
    <PageShell
      title="Chido Casino"
      subtitle="Monitoreo read-only del casino dentro del ecosistema HOCKER. Sin acciones sensibles."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link href="/memory" className="hocker-button-secondary">
            Memoria
          </Link>
          <Link href="/dashboard" className="hocker-button-primary">
            Panel
          </Link>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Estado</p>
            <p className={`mt-3 inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusClass(primary?.status ?? null)}`}>
              {primary?.status ?? "sin señal"}
            </p>
          </div>

          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Nodo</p>
            <p className="mt-1 text-lg font-black text-white">{primary?.id ?? "chido-casino-web"}</p>
          </div>

          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Eventos</p>
            <p className="mt-1 text-2xl font-black text-white">{events.length}</p>
          </div>

          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Última señal</p>
            <p className="mt-1 text-sm font-black text-white">{safeDate(primary?.last_seen_at ?? null)}</p>
          </div>
        </section>

        <Hint title="Modo seguro">
          Chido Casino está integrado solo para monitoreo. Aprobaciones, retiros, depósitos y balances no se administran desde Hocker ONE todavía.
        </Hint>

        <section className="hocker-panel-pro p-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Diagnóstico</p>
              <h2 className="mt-1 text-xl font-black text-white">
                {online ? "Chido está operativo." : degraded ? "Chido está degradado." : "Chido aún no reporta señal."}
              </h2>
            </div>

            <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusClass(primary?.status ?? null)}`}>
              {primary?.status ?? "sin señal"}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            {checks.length > 0 ? (
              checks.map((item) => (
                <div key={item.key} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{item.key}</p>
                  <p className={item.active ? "mt-2 text-sm font-black text-emerald-300" : "mt-2 text-sm font-black text-amber-300"}>
                    {item.active ? "Activo" : "Revisar"}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">{item.detail}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">Todavía no hay checks reportados por Chido Casino.</p>
            )}
          </div>
        </section>

        <section className="hocker-panel-pro overflow-hidden">
          <div className="border-b border-white/5 p-5">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Eventos</p>
            <h2 className="mt-1 text-lg font-black text-white">Bitácora Chido</h2>
          </div>

          <div className="divide-y divide-white/5">
            {events.map((event) => (
              <article key={event.id} className="p-5">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-cyan-300">{event.type}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-200">{event.message ?? "Sin mensaje."}</p>
                  </div>
                  <p className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    {safeDate(event.created_at)}
                  </p>
                </div>
              </article>
            ))}

            {events.length === 0 ? (
              <div className="p-5 text-sm text-slate-400">
                Chido todavía no tiene eventos reportados.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
