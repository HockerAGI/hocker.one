import { NextRequest } from "next/server";
import { z } from "zod";
import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
import { auditTrailEvent } from "@/lib/audit-chain";
import { json, parseBody, toApiError } from "@/app/api/_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const actorTypeSchema = z.enum(["user", "nova", "system", "worker"]);
const severitySchema = z.enum(["info", "warn", "error", "critical"]);

export async function POST(req: NextRequest) {
  const gate = requireOwnerOrInternal(req);
  if (gate) return gate;

  try {
    const body = await parseBody(req);

    const actorTypeRaw = body.actor_type == null ? "system" : String(body.actor_type).trim();
    const severityRaw = body.severity == null ? "info" : String(body.severity).trim();

    const actorType = actorTypeSchema.safeParse(actorTypeRaw);
    if (!actorType.success) {
      return json({ ok: false, error: `actor_type inválido: "${actorTypeRaw}"` }, 400);
    }

    const severity = severitySchema.safeParse(severityRaw);
    if (!severity.success) {
      return json({ ok: false, error: `severity inválido: "${severityRaw}"` }, 400);
    }

    const row = await auditTrailEvent({
      project_id: String(body.project_id ?? "hocker-one").trim(),
      event_type: String(body.event_type ?? "manual").trim(),
      entity_type: String(body.entity_type ?? "system").trim(),
      entity_id: body.entity_id == null ? null : String(body.entity_id),
      actor_type: actorType.data,
      actor_id: body.actor_id == null ? null : String(body.actor_id),
      role: String(body.role ?? "nova").trim(),
      action: String(body.action ?? "log").trim(),
      severity: severity.data,
      payload:
        body.payload && typeof body.payload === "object" && !Array.isArray(body.payload)
          ? (body.payload as Record<string, unknown>)
          : {},
    });

    return json({ ok: true, row }, 200);
  } catch (error) {
    const e = toApiError(error);
    return json({ ok: false, error: e.payload.error }, e.status);
  }
}
