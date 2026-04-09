import { NextRequest, NextResponse } from "next/server";
import { executeCommand } from "@/server/executor/hocker-core-executor";

type ExecuteBody = {
  commandId?: unknown;
  command_id?: unknown;
  projectId?: unknown;
  project_id?: unknown;
};

function pickCommandId(body: ExecuteBody): string {
  const id =
    typeof body.commandId === "string" && body.commandId.trim()
      ? body.commandId.trim()
      : typeof body.command_id === "string" && body.command_id.trim()
        ? body.command_id.trim()
        : "";

  return id;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await req.json().catch(() => ({}));

    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const commandId = pickCommandId(body as ExecuteBody);

    if (!commandId) {
      return NextResponse.json(
        { error: "commandId es obligatorio." },
        { status: 400 },
      );
    }

    await executeCommand(commandId);

    return NextResponse.json({ ok: true, commandId });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Execution error" },
      { status: 500 },
    );
  }
}