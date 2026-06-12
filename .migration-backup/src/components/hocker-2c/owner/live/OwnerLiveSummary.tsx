"use client";

import { useEffect, useMemo, useState } from "react";
import { HOCKER_AGI_REGISTRY_2C } from "@/lib/hocker-agi-registry-2c";
import { HOCKER_SYSTEM_REGISTRY_2C } from "@/lib/hocker-system-registry-2c";
import { normalizeOwnerActions, normalizeOwnerEvidence } from "./owner-live-normalizers";

type LiveSummaryState = {
  loading: boolean;
  actionsVisible: boolean;
  evidenceVisible: boolean;
  pendingCount: number | null;
  evidenceCount: number | null;
  protectedSystems: number;
  liveAgis: number;
  message: string;
};

async function fetchJson(url: string): Promise<unknown | null> {
  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
      credentials: "include",
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) return null;
    return payload;
  } catch {
    return null;
  }
}

async function loadSummary(): Promise<LiveSummaryState> {
  const actionsPayload =
    (await fetchJson("/api/agi/runtime/actions?project_id=hocker-one&limit=30")) ??
    (await fetchJson("/api/agi/runtime/actions?limit=30")) ??
    (await fetchJson("/api/commands"));

  const evidencePayload =
    (await fetchJson("/api/agi/runtime/actions?project_id=hocker-one&status=executed&limit=30")) ??
    (await fetchJson("/api/agi/runtime/actions?status=executed&limit=30")) ??
    (await fetchJson("/api/agi/runtime/memory/publication-audit?limit=30"));

  const actions = normalizeOwnerActions(actionsPayload);
  const evidence = normalizeOwnerEvidence(evidencePayload);

  const pendingCount = actions.length;
  const evidenceCount = evidence.length;

  return {
    loading: false,
    actionsVisible: Boolean(actionsPayload),
    evidenceVisible: Boolean(evidencePayload),
    pendingCount,
    evidenceCount,
    protectedSystems: HOCKER_SYSTEM_REGISTRY_2C.filter((system) => system.protected).length,
    liveAgis: HOCKER_AGI_REGISTRY_2C.filter((agi) => agi.status === "live" || agi.status === "ready").length,
    message:
      pendingCount > 0
        ? `Hay ${pendingCount} acción(es) visibles para revisar.`
        : "No hay acciones visibles esperando aprobación en este momento.",
  };
}

function LiveSummaryCard({
  label,
  value,
  detail,
  tone = "blue",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "blue" | "green" | "gold" | "red";
}) {
  const toneClass =
    tone === "green"
      ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
      : tone === "gold"
        ? "border-[var(--hocker-gold)]/30 bg-[var(--hocker-gold)]/10 text-amber-100"
        : tone === "red"
          ? "border-rose-300/20 bg-rose-300/10 text-rose-100"
          : "border-cyan-300/20 bg-cyan-300/10 text-cyan-100";

  return (
    <article className={`rounded-3xl border p-4 ${toneClass}`}>
      <p className="text-xs uppercase tracking-[0.24em] opacity-70">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 opacity-75">{detail}</p>
    </article>
  );
}

export function OwnerLiveSummary() {
  const [summary, setSummary] = useState<LiveSummaryState>({
    loading: true,
    actionsVisible: false,
    evidenceVisible: false,
    pendingCount: null,
    evidenceCount: null,
    protectedSystems: HOCKER_SYSTEM_REGISTRY_2C.filter((system) => system.protected).length,
    liveAgis: HOCKER_AGI_REGISTRY_2C.filter((agi) => agi.status === "live" || agi.status === "ready").length,
    message: "NOVA está revisando el estado visible del owner.",
  });

  useEffect(() => {
    let alive = true;

    loadSummary().then((result) => {
      if (!alive) return;
      setSummary(result);
    });

    return () => {
      alive = false;
    };
  }, []);

  const actionValue = useMemo(() => {
    if (summary.loading) return "Revisando";
    if (!summary.actionsVisible) return "Sin datos";
    return String(summary.pendingCount ?? 0);
  }, [summary.actionsVisible, summary.loading, summary.pendingCount]);

  const evidenceValue = useMemo(() => {
    if (summary.loading) return "Revisando";
    if (!summary.evidenceVisible) return "Sin datos";
    return String(summary.evidenceCount ?? 0);
  }, [summary.evidenceCount, summary.evidenceVisible, summary.loading]);

  return (
    <section className="space-y-4">
      <div className="hocker-card p-5">
        <p className="text-xs uppercase tracking-[0.28em] text-[var(--hocker-cyan)]">
          Resumen vivo
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-white">NOVA revisó lo importante</h2>
        <p className="mt-2 text-sm leading-7 text-[var(--hocker-text-soft)]">
          {summary.message}
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <LiveSummaryCard
          label="Pendientes"
          value={actionValue}
          detail={summary.actionsVisible ? "Lectura real disponible." : "Endpoint no visible o sin sesión."}
          tone={(summary.pendingCount ?? 0) > 0 ? "gold" : "green"}
        />
        <LiveSummaryCard
          label="Evidencia"
          value={evidenceValue}
          detail={summary.evidenceVisible ? "Registros disponibles para revisar." : "Sin evidencia visible todavía."}
        />
        <LiveSummaryCard
          label="AGIs listas"
          value={String(summary.liveAgis)}
          detail="AGIs en estado live o ready dentro del catálogo 2C."
        />
        <LiveSummaryCard
          label="Protegidos"
          value={String(summary.protectedSystems)}
          detail="Módulos o integraciones que requieren cuidado especial."
          tone="red"
        />
      </section>
    </section>
  );
}
