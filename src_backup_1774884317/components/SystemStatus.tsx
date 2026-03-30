import { getErrorMessage } from "@/lib/errors";
"use client";

import { useEffect, useMemo, useState } from "react";

type Health = {
  status: "ok" | "degraded" | "error" | "online" | "critical" | string;
  infrastructure?: string;
  error?: string;
  message?: string;
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
    } catch (e: unknown) {
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
    <section className="rounded-[28px] border border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-black/30 backdrop-blur-2xl">
      <div className="flex items-start justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h2 className="text-lg font-black tracking-tight text-white">Salud del Ecosistema</h2>
          <p className="mt-1 text-sm text-slate-400">Monitor de enlaces y sistemas críticos en tiempo real.</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10 disabled:opacity-50"
          title="Forzar diagnóstico"
        >
          <svg className={`h-5 w-5 ${loading ? "animate-spin text-sky-400" : "text-slate-200"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className={`hocker-chip ${stateClass}`}>
          <span className="h-2 w-2 rounded-full bg-current" />
          {state}
        </div>
        <div className="text-xs text-slate-400">
          {health?.timestamp ? new Date(health.timestamp).toLocaleString() : "Sincronizando reloj..."}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
        {loading && !health
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="h-3 w-20 rounded bg-white/10" />
                <div className="mt-3 h-4 w-28 rounded bg-white/10" />
              </div>
            ))
          : summary.map((item) => (
              <div
                key={item.label}
                className={`rounded-2xl border p-4 transition-all duration-300 ${
                  item.ok ? "border-emerald-400/15 bg-white/5" : "border-rose-400/20 bg-rose-500/10"
                }`}
              >
                <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400">{item.label}</div>
                <div className="mt-3 flex items-center gap-2.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${item.ok ? "bg-emerald-400" : "bg-rose-400"}`} />
                  <span className={`text-[13px] font-bold ${item.ok ? "text-emerald-200" : "text-rose-200"}`}>
                    {item.ok ? "Conectado" : "Falla de enlace"}
                  </span>
                </div>
              </div>
            ))}
      </div>

      <div className="mt-6 border-t border-white/5 pt-5">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-slate-300">
          {error ? (
            <div className="flex items-center gap-2 text-rose-200">
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {error}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-white">{health?.infrastructure || "Hocker ONE Control Plane"}</span>
              <span className="text-slate-500">|</span>
              <span>{health?getErrorMessage() || "Todos los sistemas operando bajo parámetros nominales."}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}