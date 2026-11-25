"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { useWorkspace } from "@/components/WorkspaceContext";

export type NovaWorkspaceCapability = {
  key: string;
  label: string;
  status: "active" | "protected" | "partial" | "pending" | "blocked";
  mode: "answer_now" | "read_now" | "prepare_only" | "owner_gate" | "blocked";
  requires_owner_gate: boolean;
  can_execute_now: boolean;
  current_limit: string;
  next_step: string;
};

type CapabilitiesResponse = {
  ok?: boolean;
  meta?: {
    capabilities_contract?: {
      relevant_capabilities?: NovaWorkspaceCapability[];
    };
  };
  error?: string;
};

export function getVisibleNovaCapabilities(items: NovaWorkspaceCapability[]): NovaWorkspaceCapability[] {
  return items.filter((item) => item.status === "active" || item.status === "protected");
}

function statusLabel(status: NovaWorkspaceCapability["status"]): string {
  switch (status) {
    case "active":
      return "Disponible";
    case "protected":
      return "Requiere aprobación";
    case "partial":
      return "Parcial";
    case "pending":
      return "Pendiente";
    case "blocked":
      return "No disponible";
  }
}

function fillNovaComposer(prompt: string): boolean {
  const textarea = document.querySelector<HTMLTextAreaElement>('textarea[aria-label="Mensaje para NOVA"]');
  if (!textarea) return false;

  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
  setter?.call(textarea, prompt);
  textarea.dispatchEvent(new Event("input", { bubbles: true }));
  textarea.focus();
  return true;
}

export default function NovaWorkspaceCapabilities() {
  const { projectId, ready } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [capabilities, setCapabilities] = useState<NovaWorkspaceCapability[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadCapabilities = useCallback(async () => {
    if (!ready) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/nova/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: projectId,
          message: "¿Qué capacidades tienes disponibles ahora?",
          allow_actions: false,
        }),
        cache: "no-store",
      });
      const body = (await response.json().catch(() => ({}))) as CapabilitiesResponse;
      if (!response.ok || body.ok === false) throw new Error(body.error ?? "No se pudo consultar capacidades.");
      const items = body.meta?.capabilities_contract?.relevant_capabilities ?? [];
      setCapabilities(items.filter((item) => item && typeof item.key === "string"));
    } catch {
      setCapabilities([]);
      setError("No se pudo consultar capacidades.");
    } finally {
      setLoading(false);
    }
  }, [projectId, ready]);

  useEffect(() => {
    if (open) void loadCapabilities();
  }, [loadCapabilities, open]);

  const actionable = useMemo(() => getVisibleNovaCapabilities(capabilities), [capabilities]);
  const unavailable = useMemo(
    () => capabilities.filter((capability) => !getVisibleNovaCapabilities([capability]).length),
    [capabilities],
  );

  const chooseCapability = (capability: NovaWorkspaceCapability) => {
    const prompt = capability.requires_owner_gate
      ? `Quiero usar ${capability.label}. Prepara la acción y dime qué aprobación necesito.`
      : `Quiero usar ${capability.label}.`;
    fillNovaComposer(prompt);
    window.dispatchEvent(new CustomEvent("nova-workspace-capability", { detail: { key: capability.key, prompt } }));
    setOpen(false);
  };

  return (
    <div className="relative">
      <div className="flex items-center">
        {open ? (
          <section
            aria-label="Capacidades de NOVA"
            className="absolute bottom-full left-0 z-40 mb-2 w-[min(86vw,520px)] max-h-[55dvh] overflow-auto rounded-2xl border border-white/[0.10] bg-[#07101d]/96 p-3 shadow-2xl backdrop-blur-xl"
          >
            <div className="flex items-center justify-between gap-3 px-1 pb-2">
              <div>
                <p className="text-sm font-semibold text-white">Capacidades</p>
                <p className="text-xs text-slate-500">Sólo aparecen como acción las que están realmente disponibles.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 hover:bg-white/[0.06] hover:text-white" aria-label="Cerrar capacidades">
                <X className="h-4 w-4" />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center gap-2 px-2 py-4 text-xs text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Comprobando capacidades reales…</div>
            ) : error ? (
              <div className="rounded-xl border border-rose-300/15 bg-rose-300/5 px-3 py-2 text-xs leading-5 text-rose-100">{error} <button type="button" onClick={() => void loadCapabilities()} className="underline">Reintentar</button></div>
            ) : (
              <div className="space-y-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  {actionable.map((capability) => (
                    <button key={capability.key} type="button" onClick={() => chooseCapability(capability)} className="rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-3 text-left transition hover:border-sky-300/30 hover:bg-white/[0.05]">
                      <span className="block text-sm font-medium text-white">{capability.label}</span>
                      <span className="mt-1 block text-[11px] text-slate-500">{statusLabel(capability.status)}</span>
                    </button>
                  ))}
                </div>

                {unavailable.length > 0 ? (
                  <div className="border-t border-white/[0.06] pt-2">
                    <p className="px-1 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">En preparación</p>
                    <div className="space-y-1">
                      {unavailable.slice(0, 5).map((capability) => (
                        <div key={capability.key} className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-xs text-slate-500">
                          <span>{capability.label}</span><span>{statusLabel(capability.status)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </section>
        ) : null}

        <button type="button" onClick={() => setOpen((value) => !value)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-700 bg-[#101b29] px-3 text-xs text-slate-200 hover:bg-white/5" aria-expanded={open} aria-label={open ? "Cerrar capacidades" : "Abrir capacidades"} title="Capacidades de NOVA">
          {open ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
          <span>Capacidades</span>
        </button>
      </div>
    </div>
  );
}
