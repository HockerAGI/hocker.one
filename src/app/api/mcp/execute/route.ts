/**
 * Hocker ONE — MCP direct read endpoint.
 *
 * Only proven read-only tools may execute here. Every mutation must first be
 * materialized in agi_action_queue, approved by the Owner and executed by the
 * locked worker.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
import { getMcpRegistry } from "@/lib/mcp/mcp-registry";
import {
  assertMcpToolAvailable,
  isReadOnlyMcpTool,
  MCP_PROVIDER_IDS,
  type McpProviderId,
} from "@/lib/mcp/mcp-policy";
import { log } from "@/lib/logger";
import { sanitizePublicError } from "@/lib/sanitize-error";

export const dynamic = "force-dynamic";

const ExecuteSchema = z.object({
  provider: z.enum(MCP_PROVIDER_IDS),
  tool: z.string().min(1).max(160),
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
          error: "Solicitud MCP inválida.",
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const provider = parsed.data.provider as McpProviderId;
    const { tool, args } = parsed.data;

    if (!isReadOnlyMcpTool(provider, tool)) {
      return NextResponse.json(
        {
          ok: false,
          trace_id: traceId,
          code: "MCP_MUTATION_REQUIRES_OWNER_GATE_QUEUE",
          error: "Esta herramienta modifica o puede modificar datos. Debe prepararse en NOVA Chat, aprobarse y ejecutarse desde la cola segura.",
          provider,
          tool,
        },
        { status: 409 },
      );
    }

    await assertMcpToolAvailable(provider, tool);

    log.info("MCP read request", {
      route: "/api/mcp/execute",
      trace_id: traceId,
      provider,
      tool,
    });

    const registry = getMcpRegistry();
    const result = await registry.executeTool(provider, tool, args);

    return NextResponse.json({
      ok: true,
      trace_id: traceId,
      provider,
      tool,
      read_only: true,
      result,
    });
  } catch (err: unknown) {
    log.error("MCP read failure", {
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
