"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2, PlugZap, RefreshCw, ShieldCheck, Wrench, X } from "lucide-react";

type Tool = { name: string; description?: string; inputSchema?: unknown };
type Provider = {
  id: string; name: string; configured: boolean; connected: boolean;
  capabilities: string[]; toolCount: number; lastPingAt: string | null; lastError: string | null;
};
type Registry = { providers: Provider[]; tools: Record<string, Tool[]>; initialized: boolean; connectedProviders: number; configuredProviders: number; totalProviders: number };

function providerLabel(status: Provider) {
  if (status.connected) return "Conectada";
  if (status.configured) return "Configurada";
  return "No configurada";
}

export default function NovaWorkspaceTools() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registry, setRegistry] = useState<Registry | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (initialize = false) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/mcp/status", {
        method: initialize ? "POST" : "GET",
        headers: initialize ? { "Content-Type": "application/json" } : undefined,
        cache: "no-store",
      });
      const body = await response.json().catch(() => ({})) as {
        ok?: boolean; error?: string; mcp_registry?: Registry; initialized?: boolean;
      };
      if (!response.ok || body.ok === false) throw new Error(body.error ?? `MCP HTTP ${response.status}`);
      if (!body.mcp_registry) throw new Error("El registry MCP no devolvió estado.");
      setRegistry({ ...body.mcp_registry, initialized: Boolean(body.initialized ?? initialize) });
    } catch (value) {
      setError(value instanceof Error ? value.message : "No se pudo consultar el MCP Registry.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && !registry && !loading) void load(false);
  }, [loading, load, open, registry]);

  const tools = useMemo(() => {
    if (!registry) return [];
    return Object.entries(registry.tools).flatMap(([provider, items]) =>
      items.map((tool) => ({ provider, tool })),
    );
  }, [registry]);

  const connected = registry?.providers.filter((item) => item.connected).length ?? 0;
  const configured = registry?.providers.filter((item) => item.configured).length ?? 0;

  return (
    <div className="pointer-events-none absolute inset-x-3 bottom-[11rem] z-30 flex justify-center sm:inset-x-5">
      <div className="pointer-events-auto flex w-full max-w-[860px] justify-end">
        {open ? (
          <section
            aria-label="Herramientas de NOVA"
            className="mb-2 w-full max-w-[520px] overflow-hidden rounded-2xl border border-white/[0.10] bg-[#07101d]/96 p-3 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center justify-between gap-3 px-1 pb-2">
              <div>
                <p className="text-sm font-semibold text-white">Herramientas</p>
                <p className="text-xs text-slate-500">MCP Registry único de Hocker One. Lectura visible; escritura permanece gobernada.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-white/[0.06] hover:text-white" aria-label="Cerrar herramientas">
                <X className="h-4 w-4" />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center gap-2 px-2 py-5 text-xs text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Consultando MCP Registry…</div>
            ) : error ? (
              <div className="space-y-3">
                <div className="rounded-xl border border-rose-300/15 bg-rose-300/5 px-3 py-2 text-xs leading-5 text-rose-100">{error}</div>
                <button type="button" onClick={() => void load(false)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white">
                  <RefreshCw className="h-3.5 w-3.5" /> Reintentar
                </button>
              </div>
            ) : registry ? (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-slate-600">Proveedores</p>
                    <p className="mt-1 text-lg font-black text-white">{connected}/{configured}</p>
                  </div>
                  <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-slate-600">Tools</p>
                    <p className="mt-1 text-lg font-black text-white">{tools.length}</p>
                  </div>
                  <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-slate-600">Registro</p>
                    <p className="mt-1 text-sm font-bold text-white">{registry.initialized ? "Listo" : "No iniciado"}</p>
                  </div>
                </div>

                <div className="max-h-[280px] space-y-2 overflow-auto pr-1">
                  {registry.providers.map((provider) => (
                    <div key={provider.id} className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
                      <div className="flex items-start gap-3">
                        {provider.connected ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" /> : <PlugZap className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-xs font-semibold text-white">{provider.name}</p>
                            <span className="text-[10px] text-slate-500">{providerLabel(provider)}</span>
                          </div>
                          <p className="mt-1 text-[10px] text-slate-600">{provider.toolCount} tools · {provider.capabilities.slice(0, 3).join(", ") || "sin capacidades reportadas"}</p>
                          {provider.lastError ? <p className="mt-1 text-[10px] text-amber-200/80">{provider.lastError}</p> : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 border-t border-white/[0.06] pt-3">
                  <button type="button" onClick={() => void load(true)} disabled={loading} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white/5 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
                    {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Actualizar
                  </button>
                  <div className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/[0.07] px-3 py-2 text-xs text-slate-400">
                    <ShieldCheck className="h-3.5 w-3.5" /> Escritura → Owner Gate
                  </div>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        <button type="button" onClick={() => { setOpen((value) => !value); }} className="grid h-11 w-11 place-items-center rounded-xl border border-white/[0.10] bg-[#07101d]/96 text-slate-300 shadow-xl backdrop-blur-xl hover:bg-white/[0.07] hover:text-white" aria-expanded={open} aria-label={open ? "Cerrar herramientas" : "Abrir herramientas"} title="Herramientas MCP de NOVA">
          {open ? <X className="h-5 w-5" /> : <Wrench className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
