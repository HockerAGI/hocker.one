"use client";

import { getErrorMessage } from "@/lib/errors";
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
      if (!res.ok) throw new Error(j?.error || "Anomalía en sensores de salud.");
      setHealth(j);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // Latido cada 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="hocker-panel-pro flex flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/5 bg-sky-500/5 p-5">
        <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-sky-400">
          Diagnóstico de Sistemas
        </h3>
        <button 
          onClick={load} 
          disabled={loading}
          className="flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 transition-all hover:bg-sky-500/20 active:scale-95 disabled:opacity-50"
        >
          <div className={`h-1.5 w-1.5 rounded-full bg-sky-400 ${loading ? 'animate-ping' : ''}`} />
          <span className="text-[9px] font-bold uppercase tracking-widest text-sky-400">
            {loading ? "Escaneando" : "Actualizar"}
          </span>
        </button>
      </div>

      <div className="p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
          {loading && !health
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex h-14 items-center rounded-2xl border border-white/5 bg-slate-950/40 p-4 animate-pulse">
                  <div className="h-2 w-16 rounded bg-slate-800" />
                </div>
              ))
            : summary.map((item) => (
                <div
                  key={item.label}
                  className={`group relative flex items-center justify-between overflow-hidden rounded-2xl border bg-slate-950/60 p-4 transition-all hover:bg-slate-900/80 ${
                    item.ok ? "border-emerald-500/10 hover:border-emerald-500/30" : "border-rose-500/20 hover:border-rose-500/40"
                  }`}
                >
                  <span className="text-[11px] font-black uppercase tracking-widest text-white">
                    {item.label}
                  </span>
                  <div className={`flex items-center gap-2 rounded-full border px-2 py-1 ${
                    item.ok ? "border-emerald-500/20 bg-emerald-500/10" : "border-rose-500/30 bg-rose-500/10"
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${item.ok ? "bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]"}`} />
                    <span className={`text-[9px] font-bold uppercase tracking-widest ${item.ok ? "text-emerald-400" : "text-rose-400"}`}>
                      {item.ok ? "Nominal" : "Falla"}
                    </span>
                  </div>
                </div>
              ))}
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-[11px] font-bold tracking-wide text-rose-300 flex items-center gap-3">
            <svg className="h-5 w-5 shrink-0 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error}
          </div>
        )}
      </div>
    </section>
  );
}
