"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, ShieldCheck, WifiOff } from "lucide-react";

type PulseStatus = "loading" | "ready" | "blocked" | "error";

type SystemPayload = {
  ok?: boolean;
  status?: string;
  message?: string;
  traceId?: string;
  [key: string]: unknown;
};

function readHumanStatus(payload: SystemPayload | null, status: PulseStatus): string {
  if (status === "loading") return "Revisando";
  if (status === "blocked") return "Protegido";
  if (status === "error") return "Sin conexión";
  if (!payload) return "Disponible";

  if (payload.ok === true) return "Activo";
  if (typeof payload.status === "string") return payload.status;
  return "Disponible";
}

export function OwnerSystemPulsePanel() {
  const [status, setStatus] = useState<PulseStatus>("loading");
  const [payload, setPayload] = useState<SystemPayload | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch("/api/system/status", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const data = (await response.json().catch(() => ({}))) as SystemPayload;

        if (!active) return;

        setPayload(data);
        setStatus(response.ok ? "ready" : response.status === 401 || response.status === 403 ? "blocked" : "error");
      } catch {
        if (!active) return;
        setStatus("error");
        setPayload(null);
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const humanStatus = useMemo(() => readHumanStatus(payload, status), [payload, status]);

  return (
    <section className="hocker-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-[var(--hocker-cyan)]">Pulso del sistema</p>
          <h2 className="mt-2 text-xl font-semibold text-white">{humanStatus}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--hocker-text-soft)]">
            Lectura segura basada en endpoint GET. Si la sesión no autoriza, se muestra protegido sin romper la vista.
          </p>
        </div>

        <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-3 text-cyan-50">
          {status === "error" ? <WifiOff className="h-5 w-5" /> : status === "blocked" ? <ShieldCheck className="h-5 w-5" /> : <Activity className="h-5 w-5" />}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--hocker-text-muted)]">API</p>
          <p className="mt-2 text-sm font-semibold text-white">/api/system/status</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--hocker-text-muted)]">Método</p>
          <p className="mt-2 text-sm font-semibold text-white">GET seguro</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-3">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--hocker-text-muted)]">Resultado</p>
          <p className="mt-2 text-sm font-semibold text-white">{humanStatus}</p>
        </div>
      </div>

      {payload?.message ? (
        <p className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3 text-xs leading-5 text-[var(--hocker-text-soft)]">
          {payload.message}
        </p>
      ) : null}
    </section>
  );
}
