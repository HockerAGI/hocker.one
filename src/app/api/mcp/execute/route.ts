/**
 * Hocker ONE — MCP Execute API Endpoint
 *
 * Allows NOVA and AGIs to execute tools on MCP providers.
 * Owner/internal gate required. Rate-limited for safety.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
import { getMcpRegistry } from "@/lib/mcp/mcp-registry";
import { log } from "@/lib/logger";
import { sanitizePublicError } from "@/lib/sanitize-error";

export const dynamic = "force-dynamic";

const ExecuteSchema = z.object({
  provider: z.enum(["supabase", "vercel", "github", "openai"]),
  tool: z.string().min(1),
  args: z.record(z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  const traceId = crypto.randomUUID();
  const ownerGate = requireOwnerOrInternal(req, traceId);
  if (ownerGate) return ownerGate;

  try {
    const rawBody = await req.json().catch(() => ({}));
    const parsed = ExecuteSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          trace_id: traceId,
          error: "Invalid MCP execute payload.",
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { provider, tool, args } = parsed.data;

    log.info("MCP execute request", {
      route: "/api/mcp/execute",
      trace_id: traceId,
      provider,
      tool,
    });

    const registry = getMcpRegistry();

    if (!registry.isInitialized) {
      await registry.initializeAll();
    }

    const result = await registry.executeTool(provider, tool, args);

    return NextResponse.json({
      ok: true,
      trace_id: traceId,
      provider,
      tool,
      result,
    });
  } catch (err: unknown) {
    log.error("MCP execute failure", {
      route: "/api/mcp/execute",
      trace_id: traceId,
      detail: sanitizePublicError(err),
    });

    return NextResponse.json(
      {
        ok: false,
        trace_id: traceId,
        error: sanitizePublicError(err),
      },
      { status: 500 },
    );
  }
}
