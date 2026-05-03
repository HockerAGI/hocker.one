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
  description: "Monitoreo read-only de Chido Casino y sus AGIs responsables dentro del ecosistema HOCKER.",
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

type AgiRow = {
  id: string;
  name: string | null;
  description: string | null;
  version: string | null;
  tags: string[] | null;
  meta: JsonObject | null;
};

const RESPONSIBLE_AGIS = [
  {
    id: "chido_gerente",
    label: "Chido Gerente",
    role: "Operación del casino",
    mission: "Coordina operación diaria, usuarios, métricas, bonos y seguimiento operativo.",
  },
  {
    id: "chido_wins",
    label: "Chido Wins",
    role: "Predicción y simulación",
    mission: "Analiza escenarios probabilísticos y simulaciones responsables. No ejecuta apuestas automáticas.",
  },
  {
    id: "curvewind",
    label: "Curvewind",
    role: "Estrategia predictiva",
    mission: "Modela escenarios, crecimiento, reinversión y comportamiento del sistema.",
  },
  {
    id: "numia",
    label: "NUMIA",
    role: "Finanzas y control",
    mission: "Supervisa ROI, costos, límites, saldos, depósitos, retiros y sostenibilidad.",
  },
  {
    id: "vertx",
    label: "VERTX",
    role: "Seguridad",
    mission: "Protege sesiones, APIs, webhooks, firmas, riesgo técnico y antifraude.",
  },
  {
    id: "jurix",
    label: "JURIX",
    role: "Legalidad y cumplimiento",
    mission: "Supervisa juego responsable, KYC, privacidad, términos y cumplimiento.",
  },
  {
    id: "hostia",
    label: "HOSTIA",
    role: "Infraestructura",
    mission: "Vigila hosting, deploys, endpoints, pasarelas, tokens y estabilidad técnica.",
  },
  {
    id: "syntia",
    label: "SYNTIA",
    role: "Memoria y continuidad",
    mission: "Guarda contexto, decisiones, estado operativo y continuidad IA a IA.",
  },
  {
    id: "nova",
    label: "NOVA",
    role: "Dirección central",
    mission: "Supervisa toda la división Chido Casino como núcleo ejecutivo del ecosistema HOCKER.",
  },
] as const;

function safeDate(input: string | null): string {
  if (!input) return "—";
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("es-MX");
}

function statusClass(status: string | null): string {
  if (status === "online" || status === "active") return "border-emerald-400/20 bg-emerald-500/10 text-emerald-300";
  if (status === "degraded" || status === "guarded") return "border-amber-400/20 bg-amber-500/10 text-amber-300";
  if (status === "offline" || status === "blocked") return "border-rose-400/20 bg-rose-500/10 text-rose-300";
  if (status === "planned") return "border-violet-400/20 bg-violet-500/10 text-violet-300";
  return "border-slate-400/20 bg-slate-500/10 text-slate-300";
}

function asRecord(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as JsonObject) : {};
}

function asText(value: unknown, fallback = "—"): string {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function getChecks(meta: JsonObject | null): Array<{ key: string; active: boolean; detail: string }> {
  const checks = asRecord(asRecord(meta).checks);

  return Object.entries(checks).map(([key, value]) => {
    const item = asRecord(value);

    return {
      key,
      active: item.active === true,
      detail: asText(item.detail),
    };
  });
}

function getAgiStatus(agi: AgiRow | undefined): string {
  const meta = asRecord(agi?.meta);
  return asText(meta.status, "registered");
}

function getAgiArea(agi: AgiRow | undefined): string {
  const meta = asRecord(agi?.meta);
  return asText(meta.owner_area, "Casino");
}

async function loadChido() {
  const sb = createAdminSupabase();

  const [{ data: nodes }, { data: events }, { data: agis }] = await Promise.all([
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
    sb
      .from("agis")
      .select("id,name,description,version,tags,meta")
      .in("id", RESPONSIBLE_AGIS.map((agi) => agi.id)),
  ]);

  return {
    nodes: (nodes ?? []) as NodeRow[],
    events: (events ?? []) as EventRow[],
    agis: (agis ?? []) as AgiRow[],
  };
}

export default async function ChidoPage() {
  const { nodes, events, agis } = await loadChido();
  const primary = nodes.find((node) => node.id === "chido-casino-web") ?? nodes[0] ?? null;
  const checks = getChecks(primary?.meta ?? null);

  const online = primary?.status === "online";
  const degraded = primary?.status === "degraded";
  const registry = new Map(agis.map((agi) => [agi.id, agi]));

  return (
    <PageShell
      title="Chido Casino"
      subtitle="Monitoreo read-only del casino y sus AGIs responsables dentro del ecosistema HOCKER."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link href="/chido/research-gate" className="hocker-button-secondary">
            Research Gate
          </Link>
          <Link href="/chido/actions" className="hocker-button-secondary">
            Acciones
          </Link>
          <Link href="/chido/ops" className="hocker-button-secondary">
            Operación
          </Link>
          <Link href="/agis" className="hocker-button-secondary">
            AGIs
          </Link>
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
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">AGIs</p>
            <p className="mt-1 text-2xl font-black text-white">{RESPONSIBLE_AGIS.length}</p>
          </div>

          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Última señal</p>
            <p className="mt-1 text-sm font-black text-white">{safeDate(primary?.last_seen_at ?? null)}</p>
          </div>
        </section>

        <Hint title="Modo seguro">
          Chido Casino está integrado solo para monitoreo. Aprobaciones, retiros, depósitos, balances y apuestas no se administran desde Hocker ONE todavía.
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
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">AGI Layer</p>
            <h2 className="mt-1 text-lg font-black text-white">AGIs responsables del casino</h2>
          </div>

          <div className="grid grid-cols-1 gap-3 p-5 lg:grid-cols-3">
            {RESPONSIBLE_AGIS.map((config) => {
              const agi = registry.get(config.id);
              const status = getAgiStatus(agi);

              return (
                <article key={config.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">{config.role}</p>
                      <h3 className="mt-1 text-base font-black text-white">{agi?.name ?? config.label}</h3>
                    </div>

                    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${statusClass(status)}`}>
                      {status}
                    </span>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-slate-300">{config.mission}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-slate-300">
                      {config.id}
                    </span>
                    <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-slate-300">
                      {getAgiArea(agi)}
                    </span>
                  </div>
                </article>
              );
            })}
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
