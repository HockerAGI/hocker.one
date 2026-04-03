import { Langfuse } from "langfuse-node";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getErrorMessage } from "@/lib/errors";
import type { ControlRow, JsonObject } from "@/lib/types";
import {
  ApiError,
  CONTROL_ROW_ID,
  getControls,
  json,
  parseBody,
  parseQuery,
  requireProjectRole,
  toApiError,
  upsertControls,
} from "../../_lib";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_BASE_URL || "https://cloud.langfuse.com",
});

function toBool(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const s = value.trim().toLowerCase();
    if (["1", "true", "yes", "on"].includes(s)) return true;
    if (["0", "false", "no", "off"].includes(s)) return false;
  }
  return fallback;
}

function asMeta(value: unknown): JsonObject {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as JsonObject;
  }
  return {};
}

async function loadControls(sb: SupabaseClient, project_id: string): Promise<ControlRow> {
  const row = await getControls(sb, project_id);
  return {
    ...row,
    meta:
      row.meta && typeof row.meta === "object" && !Array.isArray(row.meta)
        ? (row.meta as JsonObject)
        : {},
  };
}

export async function GET(req: Request): Promise<Response> {
  const trace = langfuse.trace({
    name: "Gobernanza_Lectura",
    metadata: { endpoint: "/api/governance/killswitch" },
  });

  try {
    const q = parseQuery(req);
    const project_id = String(q.get("project_id") ?? "").trim();

    if (!project_id) {
      throw new ApiError(400, { error: "project_id es obligatorio." });
    }

    const ctx = await requireProjectRole(project_id, [
      "owner",
      "admin",
      "operator",
      "viewer",
    ]);

    trace.update({ userId: ctx.user.id, tags: [project_id, "governance_read"] });

    const controls = await loadControls(ctx.sb, ctx.project_id);
    return json({ ok: true, controls });
  } catch (err: unknown) {
    const apiErr = toApiError(err);
    trace.event({
      name: "FALLA_LECTURA",
      level: "ERROR",
      output: { error: apiErr.message },
    });
    return json(apiErr.payload, apiErr.status);
  } finally {
    await langfuse.flushAsync();
  }
}

export async function POST(req: Request): Promise<Response> {
  const trace = langfuse.trace({
    name: "Gobernanza_Update",
    metadata: { endpoint: "/api/governance/killswitch" },
  });

  try {
    const body = await parseBody(req);
    const project_id = String(body.project_id ?? "").trim();

    if (!project_id) {
      throw new ApiError(400, { error: "project_id es obligatorio." });
    }

    const ctx = await requireProjectRole(project_id, ["owner", "admin"]);
    trace.update({ userId: ctx.user.id, tags: [project_id, "governance_write"] });

    const next: ControlRow = {
      id: CONTROL_ROW_ID,
      project_id: ctx.project_id,
      kill_switch: toBool(body.kill_switch, false),
      allow_write: toBool(body.allow_write, false),
      meta: asMeta(body.meta),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const controls = await upsertControls(ctx.sb, next);

    trace.event({ name: "SOBERANIA_ACTUALIZADA", input: next });
    return json({ ok: true, controls });
  } catch (err: unknown) {
    const apiErr = toApiError(err);
    trace.event({
      name: "FALLA_POST",
      level: "ERROR",
      output: { error: apiErr.message },
    });
    return json(apiErr.payload, apiErr.status);
  } finally {
    await langfuse.flushAsync();
  }
}