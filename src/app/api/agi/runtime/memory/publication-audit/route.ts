import { randomUUID } from "crypto";
import { json, parseBody, parseQuery, requireProjectRole, toApiError } from "@/app/api/_lib";
import {
  buildSyntiaPublicationDiff,
  getSyntiaMemoryPublicationAuditPublicContext,
  listSyntiaMemoryPublicationAudit,
  previewSyntiaPublishedMemoryRollback,
  rollbackSyntiaPublishedMemory,
} from "@/lib/syntia-memory-publication-audit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const query = parseQuery(req);
    const projectId = query.get("project_id") || "hocker-one";
    const ctx = await requireProjectRole(projectId, ["owner", "admin", "operator", "viewer"]);
    const snapshot = await listSyntiaMemoryPublicationAudit(ctx.project_id, Number(query.get("limit") || 50));

    return json({
      ...snapshot,
      role: ctx.role,
      message: "Memory Publication Audit 12.7I leído con seguridad. GET no modifica memoria.",
    });
  } catch (e) {
    const err = toApiError(e);
    return json(err.body, err.status);
  }
}

export async function POST(req: Request) {
  const traceId = randomUUID();

  try {
    const input = await parseBody(req);
    const projectId = String(input.project_id || "hocker-one");
    const ctx = await requireProjectRole(projectId, ["owner"]);

    const action = String(input.action || "preview").trim().toLowerCase();

    if (action === "list") {
      return json(await listSyntiaMemoryPublicationAudit(ctx.project_id));
    }

    if (action === "diff") {
      return json(await buildSyntiaPublicationDiff({ ...input, project_id: ctx.project_id }));
    }

    if (action === "preview") {
      return json(await previewSyntiaPublishedMemoryRollback({ ...input, project_id: ctx.project_id }));
    }

    if (action === "rollback") {
      const result = await rollbackSyntiaPublishedMemory(
        { ...input, project_id: ctx.project_id },
        "session_owner",
        traceId,
      );

      return json(result, Number(result.http_status || 200));
    }

    return json(
      {
        ok: false,
        trace_id: traceId,
        reason: "unsupported_memory_publication_audit_action",
        allowed_actions: ["list", "diff", "preview", "rollback"],
        public_context: getSyntiaMemoryPublicationAuditPublicContext(),
      },
      400,
    );
  } catch (e) {
    const err = toApiError(e);
    return json({ ...err.body, trace_id: traceId }, err.status);
  }
}
