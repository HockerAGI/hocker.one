# HOCKER ONE · 13-2C-H-A Owner Gate Schema Audit

## Objetivo

Auditar endpoints reales antes de conectar botones owner de aprobación/rechazo.

## Endpoint: actions list/create

```ts
import { z } from "zod";
import { enqueueAgiAction } from "@/lib/agi-runtime-core";
import { listAgiActions } from "@/lib/agi-action-execution";
import { json, parseBody, parseQuery, requireProjectRole, toApiError } from "@/app/api/_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RuntimeActionInput = {
  project_id: string;
  agi_id: string;
  tool_key?: string | null;
  action_type: string;
  title: string;
  payload: Record<string, unknown>;
  risk_level: "low" | "medium" | "high" | "critical";
  dry_run: boolean;
  requires_approval: boolean;
};

const ActionSchema = z.object({
  project_id: z.string().min(1).default(process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one"),
  agi_id: z.string().min(1),
  tool_key: z.string().min(1).nullable().optional(),
  action_type: z.string().min(1),
  title: z.string().min(1),
  payload: z.record(z.unknown()).default({}),
  risk_level: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  dry_run: z.boolean().default(true),
  requires_approval: z.boolean().default(true),
});

export async function GET(req: Request): Promise<Response> {
  try {
    const query = parseQuery(req);
    const projectId = query.get("project_id") || process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one";
    const status = query.get("status") || undefined;
    const toolKey = query.get("tool_key") || undefined;
    const limit = Number(query.get("limit") || 30);
    const ctx = await requireProjectRole(projectId, ["owner", "admin", "operator", "viewer"]);
    const actions = await listAgiActions({ project_id: ctx.project_id, status, tool_key: toolKey, limit });

    return json({
      ok: true,
      project_id: ctx.project_id,
      count: actions.length,
      actions,
      message: "Cola Herramientas reales leída con seguridad. Las escrituras reales requieren aprobación owner.",
    });
  } catch (error) {
    const apiError = toApiError(error);
    return json(apiError.payload, apiError.status);
  }
}

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await parseBody(req);
    const parsed = ActionSchema.parse(body) as RuntimeActionInput;
    const ctx = await requireProjectRole(parsed.project_id, ["owner", "admin", "operator"]);

    const item = await enqueueAgiAction({
      project_id: ctx.project_id,
      agi_id: parsed.agi_id,
      tool_key: parsed.tool_key ?? null,
      action_type: parsed.action_type,
      title: parsed.title,
      payload: parsed.payload,
      risk_level: parsed.risk_level,
      dry_run: parsed.dry_run,
      requires_approval: parsed.requires_approval,
      created_by: ctx.user.id,
    });

    return json(
      {
        ok: true,
        item,
        message: item.requires_approval ? "Acción AGI creada en revisión. No ejecuta nada sin aprobación." : "Acción AGI creada en cola segura.",
      },
      201,
    );
  } catch (error) {
    const apiError = toApiError(error);
    return json(apiError.payload, apiError.status);
  }
}
```

## Endpoint: actions decision

```ts
import { z } from "zod";
import { decideAgiAction } from "@/lib/agi-action-execution";
import { json, parseBody, requireProjectRole, toApiError } from "@/app/api/_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DecisionSchema = z.object({
  project_id: z.string().min(1).default(process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one"),
  action_id: z.string().uuid(),
  decision: z.enum(["approve", "reject"]),
  note: z.string().max(2000).optional(),
});

export async function POST(req: Request): Promise<Response> {
  try {
    const parsed = DecisionSchema.parse(await parseBody(req));
    const ctx = await requireProjectRole(parsed.project_id, ["owner"]);
    const item = await decideAgiAction({
      project_id: ctx.project_id,
      action_id: parsed.action_id,
      decision: parsed.decision,
      actor_id: ctx.user.id,
      note: parsed.note,
    });

    return json({
      ok: true,
      item,
      message: parsed.decision === "approve" ? "Acción aprobada por owner. Lista para ejecución controlada." : "Acción rechazada por owner. No se ejecutará.",
    });
  } catch (error) {
    const apiError = toApiError(error);
    return json(apiError.payload, apiError.status);
  }
}
```

## Endpoint: actions execute

```ts
import { z } from "zod";
import { executeApprovedAgiAction } from "@/lib/agi-action-execution";
import { json, parseBody, requireProjectRole, toApiError } from "@/app/api/_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ExecuteSchema = z.object({
  project_id: z.string().min(1).default(process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one"),
  action_id: z.string().uuid(),
});

export async function POST(req: Request): Promise<Response> {
  try {
    const parsed = ExecuteSchema.parse(await parseBody(req));
    const ctx = await requireProjectRole(parsed.project_id, ["owner"]);
    const item = await executeApprovedAgiAction({ project_id: ctx.project_id, action_id: parsed.action_id, actor_id: ctx.user.id });

    return json({
      ok: true,
      executed: true,
      item,
      message: "Acción aprobada ejecutada por worker seguro. Resultado guardado en auditoría.",
    });
  } catch (error) {
    const apiError = toApiError(error);
    return json(apiError.payload, apiError.status);
  }
}
```

## UI actual

```tsx
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
```
