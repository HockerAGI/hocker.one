import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import { createAdminSupabase } from "@/lib/supabase-admin";
import type { JsonObject } from "@/lib/types";
import {
  CANONICAL_INTEGRATIONS,
  HOCKER_INTEGRATION_EVENTS,
  HOCKER_INTEGRATION_REGISTRY_VERSION,
  type HockerIntegrationContract,
} from "@/lib/hocker-integrations";
import { getMcpRegistry, type McpRegistryStatus } from "@/lib/mcp/mcp-registry";
import { isReadOnlyMcpTool, MCP_PROVIDER_IDS, type McpProviderId } from "@/lib/mcp/mcp-policy";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Herramientas y APIs · Hocker ONE",
  description: "Inventario vivo de MCP, APIs, apps, permisos, herramientas y evidencia operativa.",
};

type EventRow = {
  id: string;
  type: string;
  message: string | null;
  created_at: string;
  data: JsonObject | null;
};

type PageProps = {
  searchParams?: Promise<{ q?: string }>;
};

function asRecord(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : {};
}

function asText(value: unknown, fallback = "—"): string {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function safeDate(value: unknown): string {
  const text = asText(value, "");
  if (!text) return "—";
  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("es-MX");
}

function liveStatusClass(connected: boolean, configured: boolean): string {
  if (connected) return "border-emerald-300/25 bg-emerald-300/10 text-emerald-100";
  if (configured) return "border-amber-300/25 bg-amber-300/10 text-amber-100";
  return "border-slate-300/15 bg-slate-300/[0.07] text-slate-300";
}

function liveStatusLabel(connected: boolean, configured: boolean): string {
  if (connected) return "Conectado";
  if (configured) return "Requiere revisión";
  return "Sin configurar";
}

function moduleStatusClass(status: string): string {
  if (status === "online") return "border-emerald-300/25 bg-emerald-300/10 text-emerald-100";
  if (status === "degraded") return "border-amber-300/25 bg-amber-300/10 text-amber-100";
  if (status === "offline") return "border-rose-300/25 bg-rose-300/10 text-rose-100";
  return "border-slate-300/15 bg-slate-300/[0.07] text-slate-300";
}

function isKnownProvider(value: string): boolean {
  return isKnownMcpProviderId(value);
}

function toolMode(provider: string, tool: string): "Lectura" | "Requiere aprobación" {
  if (isKnownProvider(provider) && isReadOnlyMcpTool(provider, tool)) return "Lectura";
  return "Requiere aprobación";
}

async function loadIntegrationEvents(): Promise<EventRow[]> {
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
    const response = await fetch(integration.health_endpoint, {
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
      headers: { "User-Agent": "HockerONE-ToolsInventory/1.0" },
    });
    const remote = await response.json().catch(() => ({})) as JsonObject;

    return {
      ok: response.ok,
      status: asText(remote.status, response.ok ? "online" : "offline"),
      httpStatus: response.status,
      remote,
    };
  } catch (error) {
    return {
      ok: false,
      status: "offline",
      httpStatus: 0,
      remote: { error: error instanceof Error ? error.message : "unknown_error" } as JsonObject,
    };
  }
}

async function loadMcpStatus(): Promise<McpRegistryStatus> {
  const registry = getMcpRegistry();
  if (!registry.isInitialized) return registry.initializeAll();
  return registry.getStatus();
}

export default async function IntegrationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = String(params?.q ?? "").trim().toLocaleLowerCase("es-MX");
  const [events, mcpStatus, liveHealthEntries] = await Promise.all([
    loadIntegrationEvents(),
    loadMcpStatus(),
    Promise.all(
      CANONICAL_INTEGRATIONS.map(async (integration) => ({
        moduleId: integration.module_id,
        health: await getLiveHealth(integration),
      })),
    ),
  ]);

  const healthByModule = new Map<string, EventRow>();
  const registeredByModule = new Map<string, EventRow>();
  for (const event of events) {
    const data = asRecord(event.data);
    const moduleId = asText(data.module_id, "");
    if (!moduleId) continue;
    if (event.type === HOCKER_INTEGRATION_EVENTS.healthCheck && !healthByModule.has(moduleId)) healthByModule.set(moduleId, event);
    if (event.type === HOCKER_INTEGRATION_EVENTS.registered && !registeredByModule.has(moduleId)) registeredByModule.set(moduleId, event);
  }

  const liveHealthByModule = new Map(liveHealthEntries.map((item) => [item.moduleId, item.health]));
  const filteredProviders = mcpStatus.providers.filter((provider) => {
    if (!query) return true;
    const tools = mcpStatus.tools[provider.id] ?? [];
    return [
      provider.id,
      provider.name,
      provider.type,
      ...provider.capabilities,
      ...tools.flatMap((tool) => [tool.name, tool.description]),
    ].join(" ").toLocaleLowerCase("es-MX").includes(query);
  });

  const totalTools = Object.values(mcpStatus.tools).reduce((total, tools) => total + tools.length, 0);

  return (
    <PageShell
      title="Herramientas y APIs"
      subtitle="Inventario real de proveedores, herramientas MCP, módulos conectados, permisos y evidencia."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link href="/catalog" className="hocker-button-secondary">Buscar ecosistema</Link>
          <Link href="/commands" className="hocker-button-secondary">Aprobaciones</Link>
          <Link href="/chat" className="hocker-button-primary">Pedir acción a NOVA</Link>
        </div>
      }
    >
      <div className="space-y-5">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Proveedores</p>
            <p className="mt-2 text-3xl font-black text-white">{mcpStatus.totalProviders}</p>
          </div>
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Conectados</p>
            <p className="mt-2 text-3xl font-black text-emerald-200">{mcpStatus.connectedProviders}</p>
          </div>
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Configurados</p>
            <p className="mt-2 text-3xl font-black text-amber-200">{mcpStatus.configuredProviders}</p>
          </div>
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Herramientas</p>
            <p className="mt-2 text-3xl font-black text-cyan-200">{totalTools}</p>
          </div>
          <div className="hocker-panel-pro p-4">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Registry</p>
            <p className="mt-2 break-all text-xs font-black text-white">{mcpStatus.version}</p>
          </div>
        </section>

        <form className="hocker-panel-pro flex flex-col gap-3 p-4 sm:flex-row" action="/integrations" method="get">
          <input
            name="q"
            defaultValue={params?.q ?? ""}
            placeholder="Buscar proveedor, API, herramienta o capacidad…"
            className="hocker-focus-ring min-w-0 flex-1 rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
          />
          <button className="hocker-button-primary" type="submit">Buscar</button>
          {query ? <Link href="/integrations" className="hocker-button-secondary text-center">Limpiar</Link> : null}
        </form>

        <section>
          <div className="mb-3">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">MCP conectado</p>
            <h2 className="mt-1 text-2xl font-black text-white">Proveedores y herramientas disponibles</h2>
            <p className="mt-2 text-sm text-slate-400">Lecturas comprobadas pueden ejecutarse directamente; cualquier modificación pasa por Owner Gate.</p>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {filteredProviders.map((provider) => {
              const tools = mcpStatus.tools[provider.id] ?? [];
              return (
                <article key={provider.id} className="hocker-panel-pro overflow-hidden">
                  <div className="border-b border-white/[0.07] p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-300">{provider.type}</p>
                        <h3 className="mt-1 text-xl font-black text-white">{provider.name}</h3>
                        <p className="mt-2 text-xs text-slate-500">{provider.toolCount} herramientas · último pulso {safeDate(provider.lastPingAt)}</p>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${liveStatusClass(provider.connected, provider.configured)}`}>
                        {liveStatusLabel(provider.connected, provider.configured)}
                      </span>
                    </div>
                    {provider.lastError ? (
                      <p className="mt-3 rounded-2xl border border-amber-300/15 bg-amber-300/[0.06] p-3 text-xs leading-5 text-amber-100">{provider.lastError}</p>
                    ) : null}
                  </div>

                  <div className="p-5">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Capacidades</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {provider.capabilities.length > 0 ? provider.capabilities.map((capability) => (
                        <span key={capability} className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold text-slate-300">{capability}</span>
                      )) : <span className="text-xs text-slate-500">Sin capacidades disponibles hasta conectar.</span>}
                    </div>
                  </div>

                  <div className="border-t border-white/[0.07] p-5">
                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Herramientas descubiertas</p>
                    <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1 hko-sidebar-scroll">
                      {tools.map((tool) => {
                        const mode = toolMode(provider.id, tool.name);
                        return (
                          <div key={tool.name} className="rounded-2xl border border-white/[0.07] bg-slate-950/40 p-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="break-all text-xs font-black text-white">{provider.id}.{tool.name}</p>
                                <p className="mt-1 text-xs leading-5 text-slate-400">{tool.description || "Sin descripción."}</p>
                              </div>
                              <span className={mode === "Lectura" ? "shrink-0 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2 py-1 text-[9px] font-black text-emerald-100" : "shrink-0 rounded-full border border-amber-300/20 bg-amber-300/10 px-2 py-1 text-[9px] font-black text-amber-100"}>
                                {mode}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      {tools.length === 0 ? <p className="text-xs text-slate-500">No hay herramientas cargadas para este proveedor.</p> : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {filteredProviders.length === 0 ? (
            <div className="mt-4 rounded-[28px] border border-dashed border-white/10 p-8 text-center text-sm text-slate-400">No se encontró un proveedor o herramienta con ese término.</div>
          ) : null}
        </section>

        <section>
          <div className="mb-3">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-200">Módulos del ecosistema</p>
            <h2 className="mt-1 text-2xl font-black text-white">Apps y servicios integrados</h2>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {CANONICAL_INTEGRATIONS.map((integration) => {
              const live = liveHealthByModule.get(integration.module_id);
              const healthEvent = healthByModule.get(integration.module_id);
              const registerEvent = registeredByModule.get(integration.module_id);
              const status = live?.status ?? "unknown";

              return (
                <article key={integration.module_id} className="hocker-panel-pro overflow-hidden">
                  <div className="border-b border-white/[0.07] p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-violet-300">{integration.type}</p>
                        <h3 className="mt-1 text-xl font-black text-white">{integration.name}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-400">{integration.description}</p>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${moduleStatusClass(status)}`}>{status}</span>
                    </div>
                  </div>

                  <div className="grid gap-3 p-5 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/[0.07] bg-slate-950/40 p-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">Modo de acción</p>
                      <p className="mt-2 text-xs font-bold text-amber-200">{integration.actions_mode}</p>
                    </div>
                    <div className="rounded-2xl border border-white/[0.07] bg-slate-950/40 p-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">Última señal</p>
                      <p className="mt-2 text-xs font-bold text-white">{healthEvent ? safeDate(healthEvent.created_at) : "Sin evento"}</p>
                    </div>
                    <div className="rounded-2xl border border-white/[0.07] bg-slate-950/40 p-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">Registro</p>
                      <p className="mt-2 text-xs font-bold text-white">{registerEvent ? safeDate(registerEvent.created_at) : "Pendiente"}</p>
                    </div>
                    <div className="rounded-2xl border border-white/[0.07] bg-slate-950/40 p-3">
                      <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-500">HTTP</p>
                      <p className="mt-2 text-xs font-bold text-white">{live?.httpStatus || "—"}</p>
                    </div>
                  </div>

                  <div className="border-t border-white/[0.07] p-5">
                    <div className="flex flex-wrap gap-2">
                      {integration.responsible_agis.map((agi) => <span key={agi} className="rounded-full border border-violet-300/10 bg-violet-300/[0.06] px-2.5 py-1 text-[10px] font-bold text-violet-100">{agi}</span>)}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link href={integration.dashboard_path} className="hocker-button-primary">Abrir módulo</Link>
                      <Link href="/commands" className="hocker-button-secondary">Ver aprobaciones</Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="hocker-panel-pro overflow-hidden">
          <div className="border-b border-white/[0.07] p-5">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Evidencia reciente</p>
            <h2 className="mt-1 text-lg font-black text-white">Eventos de integración</h2>
          </div>
          <div className="divide-y divide-white/[0.07]">
            {events.slice(0, 12).map((event) => {
              const data = asRecord(event.data);
              return (
                <article key={event.id} className="p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-cyan-300">{event.type}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-200">{asText(event.message, "Sin mensaje.")}</p>
                      <p className="mt-2 text-xs text-slate-500">Módulo: {asText(data.module_id)}</p>
                    </div>
                    <p className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-slate-500">{safeDate(event.created_at)}</p>
                  </div>
                </article>
              );
            })}
            {events.length === 0 ? <div className="p-5 text-sm text-slate-400">Todavía no hay eventos del registry.</div> : null}
          </div>
        </section>

        <p className="px-1 text-[10px] text-slate-600">Registry de módulos: {HOCKER_INTEGRATION_REGISTRY_VERSION}</p>
      </div>
    </PageShell>
  );
}
