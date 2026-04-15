import { NextResponse } from "next/server";
import { executeCommand } from "@/server/executor/hocker-core-executor";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type ExecuteBody = {
  commandId?: unknown;
  command_id?: unknown;
  projectId?: unknown;
  project_id?: unknown;
};

function pickCommandId(body: ExecuteBody): string {
  if (typeof body.commandId === "string" && body.commandId.trim()) {
    return body.commandId.trim();
  }

  if (typeof body.command_id === "string" && body.command_id.trim()) {
    return body.command_id.trim();
  }

  return "";
}

function pickProjectId(body: ExecuteBody): string | null {
  if (typeof body.projectId === "string" && body.projectId.trim()) {
    return body.projectId.trim();
  }

  if (typeof body.project_id === "string" && body.project_id.trim()) {
    return body.project_id.trim();
  }

  return null;
}

function readInternalToken(req: Request): string {
  const auth = req.headers.get("authorization") ?? req.headers.get("x-hocker-internal-token") ?? "";
  return auth.replace(/^Bearer\s+/i, "").trim();
}

function expectedInternalToken(): string {
  return String(process.env.COMMAND_HMAC_SECRET ?? "").trim();
}

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const expected = expectedInternalToken();
    const token = readInternalToken(req);

    if (!expected || token !== expected) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body: unknown = await req.json().catch(() => ({}));

    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
    }

    const commandId = pickCommandId(body as ExecuteBody);
    const projectId = pickProjectId(body as ExecuteBody);

    if (!commandId) {
      return NextResponse.json(
        { ok: false, error: "commandId es obligatorio." },
        { status: 400 },
      );
    }

    await executeCommand(commandId, projectId ?? undefined);

    return NextResponse.json({ ok: true, commandId, projectId });
  } catch (err: unknown) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Execution error" },
      { status: 500 },
    );
  }
}