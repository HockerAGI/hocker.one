import { NextRequest, NextResponse } from "next/server";
import { executeCommand } from "@/server/executor/hocker-core-executor";

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json();

    if (
      typeof body !== "object" ||
      body === null ||
      typeof (body as any).commandId !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid payload" },
        { status: 400 }
      );
    }

    const { commandId } = body as { commandId: string };

    await executeCommand(commandId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Execution error" },
      { status: 500 }
    );
  }
}