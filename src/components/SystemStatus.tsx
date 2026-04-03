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
  langfuse: boolean;
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

function CheckDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={[
        "inline-flex h-2.5 w-2.5 rounded-full",
        ok ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.55)]" : "bg-rose-400 shadow-[0_0_12px_rgba(251,113,133,0.45)]",
      ].join(" ")}
    />
  );
}

export default function SystemStatus() {
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const summary = useMemo<StatItem[]>(() => {
    const checks = health?.checks;
    return [
      { label: "DB", ok: Boolean(checks?.db) },
      { label: "Auth", ok: Boolean(checks?.supabaseUrl && checks?.supabaseAnon) },
      { label: "NOVA", ok: Boolean(checks?.novaAgi && checks?.novaKey) },
      { label: "HMAC", ok: Boolean(checks?.commandHmac) },
      { label: "Logs", ok: Boolean(checks?.langfuse) },
    ];
  }, [health]);

  async function load(): Promise<void> {
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

  const isOnline = health?.status === "online";
  const statusLabel = isOnline ? "Activo" : "Alerta";
  const statusClass = isOnline
    ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
    : "border-rose-500/20 bg-rose-500/10 text-rose-300";

  return (
    <section className="hocker-panel-pro overflow-hidden">
      <div className="border-b border-white/5 bg-sky-500/5 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="absolute inset-0 rounded-full bg-sky-400/30 blur-md animate-pulse" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-sky-400" />
            </div>
            <div>
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-sky-400">
                Estado del sistema
              </h3>
              <p className="mt-1 text-[10px] text-slate-500">
                Lectura continua del núcleo.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void load()}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-slate-300 transition hover:border-sky-500/30 hover:text-sky-300 active:scale-95"
          >
            Refrescar
          </button>
        </div>
      </div>

      <div className="p-5">
        {loading && !health ? (
          <div className="animate-pulse space-y-3">
            <div className="h-6 w-36 rounded-full bg-white/5" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-16 rounded-2xl bg-white/5" />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-black uppercase tracking-[0.25em] text-white">
                    {statusLabel}
                  </span>
                  <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.22em] ${statusClass}`}>
                    {health?.status ?? "degraded"}
                  </span>
                </div>

                <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                  {health?.message ?? health?.error ?? "Sin lectura disponible."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => void load()}
                className="rounded-2xl border border-sky-500/20 bg-sky-500/10 px-3 py-2 text-[9px] font-black uppercase tracking-widest text-sky-300 transition hover:bg-sky-500/15 active:scale-95"
              >
                Ping
              </button>
            </div>

            {error ? (
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3 text-[11px] text-rose-200">
                {error}
              </div>
            ) : null}

            {health?.details ? (
              <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-3 text-[11px] text-slate-400">
                {health.details}
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {summary.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/5 bg-white/[0.03] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                      {item.label}
                    </span>
                    <CheckDot ok={item.ok} />
                  </div>
                  <p className={`mt-3 text-[11px] font-black uppercase tracking-[0.2em] ${item.ok ? "text-emerald-300" : "text-rose-300"}`}>
                    {item.ok ? "OK" : "FAIL"}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-4">
              <div className="text-[10px] text-slate-500">
                Núcleo: <span className="text-slate-300">{health?.infrastructure ?? "Hocker ONE Control Plane"}</span>
              </div>
              <div className="text-[10px] text-slate-500">
                Última lectura:{" "}
                <span className="text-slate-300">
                  {health?.timestamp ? new Date(health.timestamp).toLocaleString("es-MX") : "n/a"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}