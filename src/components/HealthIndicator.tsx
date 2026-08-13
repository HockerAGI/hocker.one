"use client";

import { useEffect, useState } from "react";

type HealthState = {
  overall: "healthy" | "degraded" | "down" | "loading" | "unknown";
  checks: { label: string; active: boolean }[];
  lastChecked: number;
};

const STORAGE_KEY = "hocker-health-cache";
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
    return { overall: "loading", checks: [], lastChecked: 0 };
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchHealth() {
      try {
        const res = await fetch("/api/system/status", {
          cache: "no-store",
        });

        if (!res.ok) {
          if (!cancelled) {
            setState((prev) => ({ ...prev, overall: "unknown" }));
          }
          return;
        }

        const body = await res.json();
        if (cancelled || !body?.checks) return;

        const checks = Object.values(body.checks) as { label: string; active: boolean }[];
        const activeCount = checks.filter((c) => c.active).length;
        const criticalActive = checks
          .filter((c) => c.label === "Supabase" || c.label === "NOVA")
          .every((c) => c.active);

        const overall: HealthState["overall"] =
          activeCount === checks.length
            ? "healthy"
            : criticalActive
              ? "degraded"
              : "down";

        const newState: HealthState = {
          overall,
          checks,
          lastChecked: Date.now(),
        };
        if (!cancelled) {
          setState(newState);
          writeCache(newState);
        }
      } catch {
        if (!cancelled) {
          setState((prev) => ({ ...prev, overall: "unknown" }));
        }
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
      ? "Sistema saludable"
      : state.overall === "degraded"
        ? "Sistema degradado"
        : state.overall === "down"
          ? "Sistema caído"
          : state.overall === "loading"
            ? "Verificando…"
            : "Estado desconocido";

  const activeCount = state.checks.filter((c) => c.active).length;
  const totalCount = state.checks.length;

  return (
    <div className="flex items-center gap-2" title={label}>
      <span className={`h-2.5 w-2.5 rounded-full transition-colors ${dotClass}`} />
      {totalCount > 0 && (
        <span className="hidden text-[10px] font-bold text-slate-500 xl:inline">
          {activeCount}/{totalCount}
        </span>
      )}
    </div>
  );
}
