"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getErrorMessage } from "@/lib/errors";

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

const CHECK_LABELS: Array<[keyof HealthCheckMap, string]> = [
  ["db", "DB"],
  ["supabaseUrl", "URL"],
  ["supabaseAnon", "Anon"],
  ["novaAgi", "NOVA"],
  ["novaKey", "Key"],
  ["commandHmac", "HMAC"],
  ["langfuse", "Trace"],
];

export default function SystemStatus() {
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      const data = (await res.json()) as HealthPayload;

      if (!res.ok) {
        throw new Error(data.error || data.message || `HTTP ${res.status}`);
      }

      setHealth(data);
      setError(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchHealth();
    const id = window.setInterval(() => {
      void fetchHealth();
    }, 30000);

    return () => window.clearInterval(id);
  }, [fetchHealth]);

  const overallOk = health?.status === "online";
  const items = useMemo(() => CHECK_LABELS, []);

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.35em] text-sky-300">
            Estado del sistema
          </p>
          <h3 className="mt-2 text-xl font-black tracking-tight text-white">
            {loading && !health ? "Verificando..." : overallOk ? "Online" : "Degradado"}
          </h3>
          <p className="mt-1 text-[11px] text-slate-500">
            {health?.infrastructure ?? "Control Plane"}
          </p>
        </div>

        <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-slate-300">
          {health ? formatDate(health.timestamp) : "—"}
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-400/15 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-200">
          {error}
        </div>
      ) : null}

      {health?.message ? (
        <div className="rounded-2xl border border-emerald-400/15 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-200">
          {health.message}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map(([key, label]) => {
          const ok = Boolean(health?.checks?.[key]);
          return (
            <div key={key} className="rounded-2xl border border-white/5 bg-white/[0.03] p-3">
              <div className="flex items-center gap-2">
                <CheckDot ok={ok} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                  {label}
                </span>
              </div>
              <p className="mt-2 text-sm font-bold text-white">{ok ? "OK" : "OFF"}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}