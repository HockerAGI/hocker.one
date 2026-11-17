"use client";

import { useEffect, useState } from "react";
import { evaluateServerlessCoreHealth, type RuntimeHealthCheck } from "@/lib/hocker-health-boundaries";

type HealthState = {
  overall: "healthy" | "degraded" | "down" | "loading" | "unknown";
  checks: RuntimeHealthCheck[];
  coreActive: number;
  coreTotal: number;
  optionalUnavailable: number;
  lastChecked: number;
};

const STORAGE_KEY = "hocker-core-health-cache-v2";
const POLL_INTERVAL = 30_000; // 30 seconds

function readCache(): HealthState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as HealthState;
    if (!parsed.lastChecked) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(state: HealthState) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

export default function HealthIndicator() {
  const [state, setState] = useState<HealthState>(() => {
    const cached = readCache();
    if (cached && Date.now() - cached.lastChecked < POLL_INTERVAL * 2) {
      return cached;
    }
    return { overall: "loading", checks: [], coreActive: 0, coreTotal: 0, optionalUnavailable: 0, lastChecked: 0 };
  });

  useEffect(() => {
    let cancelled = false;

    function invalidateHealth() {
      if (cancelled) return;
      const unknown: HealthState = {
        overall: "unknown",
        checks: [],
        coreActive: 0,
        coreTotal: 0,
        optionalUnavailable: 0,
        lastChecked: Date.now(),
      };
      setState(unknown);
      writeCache(unknown);
    }

    async function fetchHealth() {
      try {
        const res = await fetch("/api/system/status", {
          cache: "no-store",
        });

        if (!res.ok) {
          invalidateHealth();
          return;
        }

        const body = await res.json();
        if (cancelled) return;
        if (!body || body.health_scope !== "hocker_one_serverless_core") {
          // A rollback to an older response contract must not retain a cached
          // green indicator from a previously healthy deployment.
          invalidateHealth();
          return;
        }
        const rawChecks = body.checks as Record<string, RuntimeHealthCheck> | null;
        const summary = evaluateServerlessCoreHealth(rawChecks);
        const checks = rawChecks && typeof rawChecks === "object" && !Array.isArray(rawChecks)
          ? Object.values(rawChecks)
          : [];
        const newState: HealthState = {
          ...summary,
          checks,
          lastChecked: Date.now(),
        };
        if (!cancelled) {
          setState(newState);
          writeCache(newState);
        }
      } catch {
        invalidateHealth();
      }
    }

    // Initial fetch (with small delay to not block first paint)
    const timer = setTimeout(fetchHealth, 800);

    // Poll interval
    const interval = setInterval(fetchHealth, POLL_INTERVAL);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  const dotClass =
    state.overall === "healthy"
      ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
      : state.overall === "degraded"
        ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"
        : state.overall === "down"
          ? "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.6)]"
          : state.overall === "loading"
            ? "bg-slate-500 animate-pulse"
            : "bg-slate-600";

  const label =
    state.overall === "healthy"
      ? "Núcleo Hocker One operativo"
      : state.overall === "degraded"
        ? "Sistema degradado"
        : state.overall === "down"
          ? "Núcleo Hocker One no disponible"
          : state.overall === "loading"
            ? "Verificando…"
            : "Estado desconocido";

  const activeCount = state.coreActive;
  const totalCount = state.coreTotal;
  const tooltip = state.optionalUnavailable > 0
    ? `${label}; ${state.optionalUnavailable} capacidades opcionales no verificadas`
    : label;

  return (
    <div className="flex items-center gap-2" title={tooltip}>
      <span className={`h-2.5 w-2.5 rounded-full transition-colors ${dotClass}`} />
      {totalCount > 0 && (
        <span className="hidden text-[10px] font-bold text-slate-500 xl:inline">
          {activeCount}/{totalCount}
        </span>
      )}
    </div>
  );
}
