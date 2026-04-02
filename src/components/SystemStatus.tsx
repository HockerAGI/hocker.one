"use client";

import { getErrorMessage } from "@/lib/errors";
import { useEffect, useMemo, useState } from "react";

type HealthCheckMap = {
  db: boolean;
  supabaseUrl: boolean;
  supabaseAnon: boolean;
  novaAgi: boolean;
  novaKey: boolean;
  commandHmac: boolean;
};

type HealthPayload = {
  status: "online" | "degraded";
  infrastructure: string;
  checks: HealthCheckMap;
  message?: string;
  error?: string;
  details?: string;
  timestamp: string;
};

type StatItem = {
  label: string;
  ok: boolean;
};

export default function SystemStatus() {
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const summary = useMemo<StatItem[]>(() => {
    const checks = health?.checks;
    return [
      { label: "DB", ok: Boolean(checks?.db) },
      { label: "Auth URL", ok: Boolean(checks?.supabaseUrl) },
      { label: "Auth Key", ok: Boolean(checks?.supabaseAnon) },
      { label: "NOVA", ok: Boolean(checks?.novaAgi && checks?.novaKey) },
      { label: "HMAC", ok: Boolean(checks?.commandHmac) },
    ];
  }, [health]);

  async function load() {
    try {
      setError(null);
      const res = await fetch("/api/health", { cache: "no-store" });
      const data: unknown = await res.json();

      if (!res.ok) {
        const body = data && typeof data === "object" ? (data as Record<string, unknown>) : null;
        throw new Error(
          typeof body?.error === "string"
            ? body.error
            : "No se pudo leer el estado del sistema.",
        );
      }

      setHealth(data as HealthPayload);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => {
      void load();
    }, 30000);

    return () => window.clearInterval(timer);
  }, []);

  const statusLabel = health?.status === "online" ? "Activo" : "Con alerta";
  const statusClass =
    health?.status === "online"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
      : "border-rose-500/20 bg-rose-500/10 text-rose-300";

  return (
    <section className="hocker-panel-pro overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/5 bg-sky-500/5 p-5">
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-2.5 rounded-full bg-sky-400 animate-pulse" />
          <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-sky-400">
            Estado del sistema
          </h3>
        </div>

        <button
          type="button"
          onClick={() => void load()}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-slate-300 transition hover:border-sky-500/30 hover:text-sky-300"
        >
          Refrescar
        </button>
      </div>

      <div className="space-y-4 p-5">
        <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${statusClass}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {loading ? "Escaneando" : statusLabel}
        </div>

        {health?.infrastructure ? (
          <div className="rounded-2xl border border-white/5 bg-white/5 p-4">
            <div className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-500">
              Infraestructura
            </div>
            <div className="mt-1 text-sm font-bold text-white">{health.infrastructure}</div>
            <div className="mt-1 text-[10px] text-slate-500">
              Último pulso: {new Date(health.timestamp).toLocaleString()}
            </div>
          </div>
        ) : null}

        <div className="grid gap-3">
          {summary.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-950/40 px-4 py-3"
            >
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-300">
                {item.label}
              </span>
              <span className={item.ok ? "text-[11px] font-black text-emerald-400" : "text-[11px] font-black text-rose-400"}>
                {item.ok ? "OK" : "FAIL"}
              </span>
            </div>
          ))}
        </div>

        {health?.message ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-[11px] leading-relaxed text-emerald-200">
            {health.message}
          </div>
        ) : null}

        {error ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-[11px] leading-relaxed text-rose-300">
            {error}
          </div>
        ) : null}
      </div>
    </section>
  );
}