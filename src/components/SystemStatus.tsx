

"use client";
import { useEffect, useMemo, useState } from "react";
import { getErrorMessage } from "@/lib/errors";

type Health = {
  status: string;
  checks?: {
    db?: boolean;
    supabaseUrl?: boolean;
    supabaseAnon?: boolean;
    novaAgi?: boolean;
    novaKey?: boolean;
    commandHmac?: boolean;
    langfuse?: boolean;
  };
};

export default function SystemStatus() {
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const summary = useMemo(() => {
    const c = health?.checks;
    return [
      { label: "Base de Datos", ok: !!c?.db },
      { label: "Acceso y Auth", ok: !!c?.supabaseUrl && !!c?.supabaseAnon },
      { label: "Núcleo NOVA", ok: !!c?.novaAgi && !!c?.novaKey },
      { label: "Seguridad", ok: !!c?.commandHmac },
      { label: "Telemetría", ok: !!c?.langfuse },
    ];
  }, [health]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error || "Falla al sincronizar diagnóstico.");
      setHealth(j);
    } catch (e: any) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  const state =
    health?.status === "online" || health?.status === "ok"
      ? "Conectado"
      : health?.status === "degraded"
        ? "Degradado"
        : health?.status === "critical" || health?.status === "error"
          ? "Crítico"
          : "Sincronizando";

  const stateClass =
    health?.status === "online" || health?.status === "ok"
      ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-200"
      : health?.status === "degraded"
        ? "border-amber-400/20 bg-amber-500/10 text-amber-200"
        : "border-slate-400/20 bg-slate-500/10 text-slate-200";

  return (
    <div className="hocker-panel-pro overflow-hidden">
      <div className="p-5 border-b border-white/5 bg-sky-500/5 flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-400">Estado de la Infraestructura</h3>
        <div className="flex gap-1">
          <div className="h-1 w-3 bg-sky-500/20 rounded-full" />
          <div className="h-1 w-1 bg-sky-500/40 rounded-full animate-pulse" />
        </div>
      </div>

      <div className="p-5 space-y-4">
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map(i => <div key={i} className="h-12 bg-white/5 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {summary.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-950/40 p-3 transition-all hover:bg-slate-900/60">
                <span className="text-[11px] font-black uppercase tracking-tight text-slate-400">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${item.ok ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {item.ok ? "Nominal" : "Fallo"}
                  </span>
                  <div className={`h-1.5 w-1.5 rounded-full ${item.ok ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-rose-500 animate-pulse shadow-[0_0_8px_#f43f5e]'}`} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="m-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 p-3 text-[10px] font-bold text-rose-300">
           ANOMALÍA: {error}
        </div>
      )}
    </div>
  );
}





