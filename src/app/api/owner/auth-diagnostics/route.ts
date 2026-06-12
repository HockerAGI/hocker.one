import { NextRequest } from "next/server";
import { json, parseQuery, requireProjectRole, toApiError } from "@/app/api/_lib";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type DiagnosticCheck = {
  name: string;
  ok: boolean;
  note: string;
};

export async function GET(req: NextRequest): Promise<Response> {
  try {
    const query = parseQuery(req);
    const projectId =
      query.get("project_id") ||
      query.get("projectId") ||
      process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID ||
      "hocker-one";

    const checks: DiagnosticCheck[] = [
      {
        name: "request_received",
        ok: true,
        note: "La API recibió la solicitud GET de diagnóstico.",
      },
      {
        name: "project_id_present",
        ok: Boolean(projectId),
        note: projectId ? "project_id presente." : "Falta project_id.",
      },
    ];

    let roleContext: Record<string, unknown> | null = null;
    let roleOk = false;
    let roleError = "";

    try {
      const ctx = await requireProjectRole(String(projectId), [
        "owner",
        "admin",
        "operator",
        "viewer",
      ]);

      const maybeCtx = ctx as Record<string, unknown>;

      roleOk = true;
      roleContext = {
        project_id: String(projectId),
        role: typeof maybeCtx.role === "string" ? maybeCtx.role : "available",
        user_present: Boolean(maybeCtx.user ?? true),
      };
    } catch (error) {
      roleError = error instanceof Error ? error.message : "No se pudo validar rol.";
    }

    checks.push({
      name: "project_role_check",
      ok: roleOk,
      note: roleOk
        ? "requireProjectRole validó acceso para este project_id."
        : "requireProjectRole no validó acceso. Puede faltar sesión, cookie válida, membresía o project_id correcto.",
    });

    return json({
      ok: roleOk,
      diagnostic: "owner_api_auth",
      phase: "13-2C-H-F-D",
      project_id: String(projectId),
      checks,
      role_context: roleContext,
      auth_error_visible: roleOk ? null : roleError,
      safe_notes: [
        "Este endpoint no expone tokens.",
        "Este endpoint no usa service role en cliente.",
        "Este endpoint no ejecuta acciones.",
        "Este endpoint no relaja requireProjectRole.",
      ],
    });
  } catch (error) {
    return toApiError(error) as unknown as Response;
  }
}
