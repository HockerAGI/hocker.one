"use client";

import { useEffect, useMemo, useState } from "react";

type Health = {
  status: "ok" | "degraded" | "error" | string;
  infrastructure?: string;
  error?: string;
  timestamp?: string;
  checks?: {
    supabaseUrl?: boolean;
    supabaseAnon?: boolean;
    novaAgi?: boolean;
    novaKey?: boolean;
    commandHmac?: boolean;
    langfuse?: boolean;
    db?: boolean;
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
      { label: "Acceso y Autenticación", ok: !!c?.supabaseUrl && !!c?.supabaseAnon },
      { label: "Núcleo NOVA", ok: !!c?.novaAgi && !!c?.novaKey },
      { label: "Capa de Seguridad", ok: !!c?.commandHmac },
      { label: "Telemetría (Langfuse)", ok: !!c?.langfuse },
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
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 30000); // Refresco cada 30 segundos
    return () => clearInterval(t);
  }, []);

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-black tracking-tight text-slate-900">Salud del Ecosistema</h2>
          <p className="mt-1 text-sm text-slate-500">Monitor de enlaces y sistemas críticos en tiempo real.</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          title="Forzar diagnóstico"
        >
          <svg className={`h-5 w-5 ${loading ? "animate-spin text-blue-500" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
        {loading && !health ? (
          // Estado de carga (Esqueletos)
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
              <div className="h-3 w-20 rounded bg-slate-200"></div>
              <div className="mt-3 flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-slate-200"></div>
                <div className="h-4 w-16 rounded bg-slate-200"></div>
              </div>
            </div>
          ))
        ) : (
          // Diagnóstico vivo
          summary.map((item) => (
            <div key={item.label} className={`group relative rounded-2xl border p-4 transition-all duration-300 hover:shadow-md ${item.ok ? "border-slate-200 bg-white hover:border-emerald-200" : "border-red-200 bg-red-50"}`}>
              <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400 group-hover:text-slate-500 transition-colors">
                {item.label}
              </div>
              <div className="mt-3 flex items-center gap-2.5">
                {item.ok ? (
                  <>
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                    </span>
                    <span className="text-[13px] font-bold text-slate-800">Conectado</span>
                  </>
                ) : (
                  <>
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"></span>
                    </span>
                    <span className="text-[13px] font-bold text-red-700">Falla de enlace</span>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center border-t border-slate-100 pt-5">
        <div className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
          {error ? (
            <div className="flex items-center gap-2 text-red-700 font-medium">
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              {error}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /></svg>
              <span>
                <span className="font-semibold text-slate-800">{health?.infrastructure || "Hocker ONE Control Plane"}</span>
                <span className="mx-2 text-slate-300">|</span> 
                {health?.timestamp ? new Date(health.timestamp).toLocaleString() : "Sincronizando reloj..."}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
