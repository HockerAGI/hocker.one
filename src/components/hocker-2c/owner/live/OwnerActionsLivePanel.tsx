"use client";

import { useEffect, useMemo, useState } from "react";
import { ActionPreviewCard, PageState } from "@/components/hocker-2c";
import { HOCKER_HUMAN_COPY } from "@/lib/hocker-human-copy";
import { normalizeOwnerActions, type OwnerLiveAction } from "./owner-live-normalizers";

type LoadState = "loading" | "ready" | "empty" | "error";

async function loadActions(): Promise<OwnerLiveAction[]> {
  const urls = [
    "/api/agi/runtime/actions?project_id=hocker-one&limit=30",
    "/api/agi/runtime/actions?limit=30",
    "/api/commands",
  ];

  let lastError: unknown = null;

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        lastError = payload;
        continue;
      }

      const actions = normalizeOwnerActions(payload);
      if (actions.length > 0) return actions;
    } catch (error) {
      lastError = error;
    }
  }

  if (lastError) return [];
  return [];
}

export function OwnerActionsLivePanel() {
  const [state, setState] = useState<LoadState>("loading");
  const [actions, setActions] = useState<OwnerLiveAction[]>([]);

  useEffect(() => {
    let alive = true;

    loadActions()
      .then((items) => {
        if (!alive) return;
        setActions(items);
        setState(items.length ? "ready" : "empty");
      })
      .catch(() => {
        if (!alive) return;
        setState("error");
      });

    return () => {
      alive = false;
    };
  }, []);

  const visibleActions = useMemo(() => actions.slice(0, 8), [actions]);

  if (state === "loading") {
    return <PageState status="loading" description="Estoy revisando acciones reales disponibles." />;
  }

  if (state === "error") {
    return <PageState status="error" description={HOCKER_HUMAN_COPY.error_generic} />;
  }

  if (state === "empty") {
    return (
      <PageState
        status="empty"
        title="No hay acciones esperando aprobación"
        description={HOCKER_HUMAN_COPY.no_pending_actions}
      />
    );
  }

  return (
    <section className="space-y-4">
      {visibleActions.map((action) => (
        <ActionPreviewCard
          key={action.id}
          title={action.title}
          summary={action.summary}
          risk={action.risk}
          target={action.target}
          steps={[
            `Responsable: ${action.responsible}`,
            `Estado: ${action.status}`,
            `Fecha: ${action.createdAt}`,
            "Revisar antes de aprobar cualquier ejecución real.",
          ]}
          requiresApproval={action.status.toLowerCase().includes("aprobación")}
        />
      ))}
    </section>
  );
}
