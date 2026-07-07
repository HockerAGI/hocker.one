/**
 * Hocker ONE — MCP Status API Endpoint
 *
 * Returns the current status of all MCP providers and their tools.
 * Accessible to owner/internal only.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
import { getMcpRegistry, getMcpConfigurationSummary } from "@/lib/mcp/mcp-registry";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const ownerGate = requireOwnerOrInternal(req);
  if (ownerGate) return ownerGate;

  try {
    const registry = getMcpRegistry();
    const status = registry.getStatus();
    const configSummary = getMcpConfigurationSummary();

    return NextResponse.json({
      ok: true,
      mcp_registry: status,
      configuration: configSummary,
      initialized: registry.isInitialized,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Failed to get MCP status",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/mcp/status — Initialize all MCP providers.
 */
export async function POST(req: NextRequest) {
  const ownerGate = requireOwnerOrInternal(req);
  if (ownerGate) return ownerGate;

  try {
    const registry = getMcpRegistry();
    const status = await registry.initializeAll();

    return NextResponse.json({
      ok: true,
      message: "MCP providers initialized.",
      mcp_registry: status,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Failed to initialize MCP providers",
      },
      { status: 500 },
    );
  }
}
