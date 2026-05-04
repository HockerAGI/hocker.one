import type { Metadata } from "next";
import Link from "next/link";
import Hint from "@/components/Hint";
import PageShell from "@/components/PageShell";
import { createAdminSupabase } from "@/lib/supabase-admin";
import type { JsonObject } from "@/lib/types";
import {
  CANONICAL_INTEGRATIONS,
  HOCKER_INTEGRATION_EVENTS,
  HOCKER_INTEGRATION_REGISTRY_VERSION,
  type HockerIntegrationContract,
} from "@/lib/hocker-integrations";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Integraciones · Hocker ONE",
  description: "Registro canónico de módulos, AGIs, APIs y endpoints conectables a Hocker ONE.",
};

type EventRow = {
  id: string;
  type: string;
  message: string | null;
  created_at: string;
  data: JsonObject | null;
};

function asRecord(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : {};
}

function asText(value: unknown, fallback = "—"): string {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text ? text : fallback;
}

function safeDate(value: unknown): string {
  const text = asText(value, "");
  if (!text) return "—";
  const d = new Date(text);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("es-MX");
}

function statusClass(status: string): string {
  if (status === "online") return "border-emerald-400/20 bg-emerald-500/10 text-emerald-300";
  if (status === "degraded") return "border-amber-400/20 bg-amber-500/10 text-amber-300";
  if (status === "offline") return "border-rose-400/20 bg-rose-500/10 text-rose-300";
  return "border-slate-400/20 bg-slate-500/10 text-slate-300";
}

async function loadIntegrationEvents() {
  const sb = createAdminSupabase();

  const { data } = await sb
    .from("events")
    .select("id,type,message,created_at,data")
    .eq("project_id", "hocker-one")
    .in("type", [
      HOCKER_INTEGRATION_EVENTS.registered,
      HOCKER_INTEGRATION_EVENTS.healthCheck,
      HOCKER_INTEGRATION_EVENTS.event,
    ])
    .order("created_at", { ascending: false })
    .limit(80);

  return (data ?? []) as EventRow[];
}

async function getLiveHealth(integration: HockerIntegrationContract) {
  try {
    const res = await fetch(integration.health_endpoint, {
      cache: "no-store",
      headers: {
        "User-Agent": "HockerONE-IntegrationsPage/0.1",
      },
    });

    const raw = await res.text();
    const json = JSON.parse(raw) as JsonObject;

    return {
      ok: res.ok,
      status: asText(json.status, res.ok ? "online" : "offline"),
      http_status: res.status,
      remote: json,
    };
  } catch (error) {
    return {
      ok: false,
      status: "offline",
      http_status: 0,
      remote: {
        error: error instanceof Error ? error.message : "unknown_error",
      } as JsonObject,
    };
  }
}

export default async function IntegrationsPage() {
  const events = await loadIntegrationEvents();

  const healthByModule = new Map<string, EventRow>();
  const registeredByModule = new Map<string, EventRow>();

  for (const event of events) {
    const data = asRecord(event.data);
    const moduleId = asText(data.module_id, "");

    if (!moduleId) continue;

    if (event.type === HOCKER_INTEGRATION_EVENTS.healthCheck && !healthByModule.has(moduleId)) {
      healthByModule.set(moduleId, event);
    }

    if (event.type === HOCKER_INTEGRATION_EVENTS.registered && !registeredByModule.has(moduleId)) {
      registeredByModule.set(moduleId, event);
    }
  }

  const liveHealthEntries = await Promise.all(
    CANONICAL_INTEGRATIONS.map(async (integration) => ({
      module_id: integration.module_id,
      health: await getLiveHealth(integration),
    })),
  );

  const liveHealthByModule = new Map(liveHealthEntries.map((item) => [item.module_id, item.health]));

  return (
    <PageShell
      title="Integration Registry"
      subtitle="Registro canónico para apps, AGIs, APIs, nodos y endpoints conectables a Hocker ONE."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link href="/chido" className="hocker-button-secondary">Chido</Link>
          <Link href="/nodes" className="hocker-button-secondary">Nodos</Link>
          <Link href="/dashboard" className="hocker-button-primary">Dashboard</Link>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <Hint title="Arquitectura escalable">
          Cada futura app, AGI, API o endpoint debe entrar por este contrato: register, health, events, read-only, dry-run, approval, signature, preflight y policy. Chido Casino queda como primer módulo canónico.
        </Hint>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Registry</p>
            <p className="mt-1 text-xs font-black text-white">{HOCKER_INTEGRATION_REGISTRY_VERSION}</p>
          </div>
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Módulos canónicos</p>
            <p className="mt-1 text-3xl font-black text-white">{CANONICAL_INTEGRATIONS.length}</p>
          </div>
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Eventos recientes</p>
            <p className="mt-1 text-3xl font-black text-white">{events.length}</p>
          </div>
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Ejecución real</p>
            <p className="mt-1 text-sm font-black text-rose-300">Bloqueada por defecto</p>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {CANONICAL_INTEGRATIONS.map((integration) => {
            const live = liveHealthByModule.get(integration.module_id);
            const healthEvent = healthByModule.get(integration.module_id);
            const registerEvent = registeredByModule.get(integration.module_id);
            const status = live?.status ?? "unknown";

            return (
              <article key={integration.module_id} className="hocker-panel-pro overflow-hidden">
                <div className="border-b border-white/5 p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-cyan-300">{integration.type}</p>
                      <h2 className="mt-1 text-xl font-black text-white">{integration.name}</h2>
                      <p className="mt-2 text-sm leading-6 text-slate-400">{integration.description}</p>
                    </div>

                    <span className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${statusClass(status)}`}>
                      {status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Module ID</p>
                    <p className="mt-1 text-xs font-bold text-white">{integration.module_id}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Actions mode</p>
                    <p className="mt-1 text-xs font-bold text-amber-300">{integration.actions_mode}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Execution lock</p>
                    <p className="mt-1 text-xs font-bold text-rose-300">{String(integration.execution_lock)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Real execution</p>
                    <p className="mt-1 text-xs font-bold text-rose-300">{String(integration.real_execution_enabled)}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Último health event</p>
                    <p className="mt-1 text-xs font-bold text-white">{healthEvent ? safeDate(healthEvent.created_at) : "—"}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Registro</p>
                    <p className="mt-1 text-xs font-bold text-white">{registerEvent ? safeDate(registerEvent.created_at) : "Pendiente"}</p>
                  </div>
                </div>

                <div className="border-t border-white/5 p-5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">AGIs responsables</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {integration.responsible_agis.map((agi) => (
                      <span key={agi} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-slate-300">
                        {agi}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="border-t border-white/5 p-5">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Capacidades</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {integration.capabilities.map((capability) => (
                      <span key={capability} className="rounded-lg border border-cyan-400/10 bg-cyan-500/5 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-cyan-200">
                        {capability}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 border-t border-white/5 p-5">
                  <Link href={integration.dashboard_path} className="hocker-button-primary">
                    Abrir módulo
                  </Link>
                  <Link href="/chido/preflight" className="hocker-button-secondary">
                    Preflight
                  </Link>
                  <Link href="/chido/signatures" className="hocker-button-secondary">
                    Firmas
                  </Link>
                </div>
              </article>
            );
          })}
        </section>

        <section className="hocker-panel-pro overflow-hidden">
          <div className="border-b border-white/5 p-5">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Eventos</p>
            <h2 className="mt-1 text-lg font-black text-white">Bitácora del registry</h2>
          </div>

          <div className="divide-y divide-white/5">
            {events.slice(0, 20).map((event) => {
              const data = asRecord(event.data);
              return (
                <article key={event.id} className="p-5">
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-cyan-300">{event.type}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-200">{asText(event.message, "Sin mensaje.")}</p>
                      <p className="mt-2 text-xs text-slate-500">module_id: {asText(data.module_id)}</p>
                    </div>
                    <p className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                      {safeDate(event.created_at)}
                    </p>
                  </div>
                </article>
              );
            })}

            {events.length === 0 ? (
              <div className="p-5 text-sm text-slate-400">
                Todavía no hay eventos del registry.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
