"use client";

import { getErrorMessage } from "@/lib/errors";
import { useCallback, useEffect, useMemo, useState } from "react";

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
        ok
          ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.55)]"
          : "bg-rose-400 shadow-[0_0_12px_rgba(251,113,133,0.45)]",
      ].join(" ")}
    />
  );
}

function formatDate(input: string): string {
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("es-MX");
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

  const load = useCallback(async (): Promise<void> => {
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
  }, []);

  useEffect(() => {
    void load();

    const timer = window.setInterval(() => {
      void load();
    }, 30000);

    return () => window.clearInterval(timer);
  }, [load]);

  const online = health?.status === "online";
  const statusLabel = online ? "Sistema estable" : health ? "Sistema degradado" : "Sin lectura";
  const statusTone = online
    ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
    : health
      ? "border-amber-400/20 bg-amber-500/10 text-amber-300"
      : "border-white/10 bg-white/[0.04] text-slate-300";

  return (
    <section className="flex h-full flex-col gap-4">
      <div className="flex items-start justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-sky-400">
            Salud
          </p>
          <h3 className="mt-2 text-lg font-black text-white sm:text-xl">
            Estado del sistema
          </h3>
        </div>

        <button
          type="button"
          onClick={() => void load()}
          className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[9px] font-black uppercase tracking-widest text-slate-200 transition-all hover:bg-white/[0.08] active:scale-95"
        >
          Refrescar
        </button>
      </div>

      {loading && !health ? (
        <div className="grid gap-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="animate-pulse rounded-[24px] border border-white/5 bg-slate-950/50 p-4"
            >
              <div className="h-3 w-24 rounded-full bg-slate-800" />
              <div className="mt-3 h-4 w-full rounded-full bg-slate-800/80" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="rounded-[28px] border border-white/5 bg-white/[0.03] p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <CheckDot ok={online} />
                <div>
                  <p className="text-sm font-black text-white">{statusLabel}</p>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {health?.infrastructure ?? "Infraestructura no disponible"}
                  </p>
                </div>
              </div>

              <span className={`rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-widest ${statusTone}`}>
                {health?.timestamp ? formatDate(health.timestamp) : "—"}
              </span>
            </div>

            <p className="mt-4 text-[12px] leading-relaxed text-slate-300">
              {error
                ? error
                : health?.message || health?.error || "Lectura completa del núcleo y las dependencias críticas."}
            </p>

            {health?.details ? (
              <details className="mt-4">
                <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 transition-colors hover:text-sky-400">
                  Ver detalle
                </summary>
                <pre className="mt-2 overflow-auto rounded-xl border border-white/10 bg-slate-950/80 p-4 font-mono text-[11px] leading-relaxed text-emerald-300 custom-scrollbar">
                  {health.details}
                </pre>
              </details>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
            {summary.map((item) => (
              <div
                key={item.label}
                className="rounded-[24px] border border-white/5 bg-slate-950/50 p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                    {item.label}
                  </p>
                  <CheckDot ok={item.ok} />
                </div>
                <p className={`mt-2 text-sm font-black ${item.ok ? "text-emerald-300" : "text-rose-300"}`}>
                  {item.ok ? "OK" : "OFF"}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}