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

function dotClass(ok: boolean) {
  return ok ? "bg-emerald-500" : "bg-amber-400";
}

export default function SystemStatus() {
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const summary = useMemo(() => {
    const c = health?.checks;
    return [
      { label: "Base de datos", ok: !!c?.db },
      { label: "Acceso", ok: !!c?.supabaseUrl && !!c?.supabaseAnon },
      { label: "NOVA", ok: !!c?.novaAgi && !!c?.novaKey },
      { label: "Seguridad", ok: !!c?.commandHmac },
      { label: "Seguimiento", ok: !!c?.langfuse },
    ];
  }, [health]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok && json?.error) throw new Error(json.error);
      setHealth(json as Health);
    } catch (e: any) {
      setError(e?.message ?? "No se pudo cargar el estado.");
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  const status = String(health?.status || "unknown").toLowerCase();
  const statusLabel = status === "ok" ? "Activa" : status === "degraded" ? "Parcial" : "Pendiente";
  const statusTone = status === "ok" ? "text-emerald-700 bg-emerald-50 border-emerald-200" : status === "degraded" ? "text-amber-700 bg-amber-50 border-amber-200" : "text-slate-700 bg-slate-50 border-slate-200";

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">
            Estado del sistema
          </div>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
            Señales vivas del control plane
          </h2>
        </div>
        <div className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.24em] ${statusTone}`}>
          <span className={`mr-2 h-2.5 w-2.5 rounded-full ${dotClass(status === "ok")}`} />
          {statusLabel}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-5">
        {summary.map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="text-xs font-bold uppercase tracking-[0.24em] text-slate-500">{item.label}</div>
            <div className={`mt-2 flex items-center gap-2 text-sm font-semibold ${item.ok ? "text-emerald-700" : "text-amber-700"}`}>
              <span className={`h-2.5 w-2.5 rounded-full ${dotClass(item.ok)}`} />
              {item.ok ? "Conectado" : "Pendiente"}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
          {loading ? (
            <span>Actualizando señales...</span>
          ) : error ? (
            <span className="text-amber-700">{error}</span>
          ) : (
            <span>
              {health?.infrastructure || "Hocker ONE Control Plane"} · {health?.timestamp ? new Date(health.timestamp).toLocaleString() : "sin hora"}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={load}
          className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Actualizar
        </button>
      </div>
    </section>
  );
}
