import { listAgiActions } from "@/lib/agi-action-execution";
import { generateAuditPDFBuffer, type AuditPDFLog } from "@/lib/export-audit";
import { json, parseQuery, requireProjectRole, toApiError } from "@/app/api/_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function text(value: unknown, fallback = "No registrado"): string {
  const clean = String(value ?? "").trim();
  return clean || fallback;
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function sanitizeFilenamePart(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9-_]+/g, "-").replace(/^-+|-+$/g, "") || "hocker-one";
}

function toAuditLog(item: unknown): AuditPDFLog {
  const action = record(item);

  return {
    action: text(action.title ?? action.action_type ?? action.id, "Acción AGI"),
    role: text(action.role ?? action.created_by_role ?? action.created_by ?? "owner/runtime"),
    created_at: text(action.created_at ?? action.updated_at ?? new Date().toISOString()),
    entity_type: text(action.action_type ?? action.tool_key ?? "agi_action"),
  };
}

export async function GET(req: Request): Promise<Response> {
  try {
    const query = parseQuery(req);
    const projectId = query.get("project_id") || process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one";
    const status = query.get("status") || "executed";
    const limit = Math.min(Number(query.get("limit") || 50), 100);

    const ctx = await requireProjectRole(projectId, ["owner", "admin"]);

    const actions = (await listAgiActions({
      project_id: ctx.project_id,
      status,
      limit,
    })) as unknown[];

    const logs = actions.map(toAuditLog);

    const pdf = await generateAuditPDFBuffer(logs);
    const pdfBody = new Uint8Array(pdf);
    const filename = `hocker-evidence-${sanitizeFilenamePart(ctx.project_id)}-${Date.now()}.pdf`;

    return new Response(pdfBody, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "X-Hocker-Phase": "13-2C-I-C3-C",
      },
    });
  } catch (error) {
    const apiError = toApiError(error);
    return json(apiError.payload, apiError.status);
  }
}
