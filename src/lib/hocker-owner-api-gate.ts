import { timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import type { JsonObject } from "@/lib/types";

export const HOCKER_OWNER_API_GATE_VERSION = "hocker-owner-api-gate-v0.1.0";

export type HockerOwnerGateResult = {
  ok: boolean;
  reason: string;
  owner_gate: "verified" | "blocked";
  version: string;
};

function safeEqual(a: string, b: string): boolean {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  if (aa.length !== bb.length) return false;
  return timingSafeEqual(aa, bb);
}

export function validateHockerOwnerApiGate(req: NextRequest): HockerOwnerGateResult {
  const required = String(process.env.HOCKER_OWNER_ACTION_KEY || "").trim();
  const provided =
    String(req.headers.get("x-hocker-owner-key") || "").trim() ||
    String(req.headers.get("x-hocker-internal-key") || "").trim();

  if (!required) {
    return {
      ok: false,
      reason: "owner_action_key_not_configured",
      owner_gate: "blocked",
      version: HOCKER_OWNER_API_GATE_VERSION,
    };
  }

  if (!provided) {
    return {
      ok: false,
      reason: "owner_or_internal_key_missing",
      owner_gate: "blocked",
      version: HOCKER_OWNER_API_GATE_VERSION,
    };
  }

  const ok = safeEqual(provided, required);

  return {
    ok,
    reason: ok ? "owner_or_internal_key_valid" : "owner_or_internal_key_invalid",
    owner_gate: ok ? "verified" : "blocked",
    version: HOCKER_OWNER_API_GATE_VERSION,
  };
}

export function ownerGateAuditData(result: HockerOwnerGateResult): JsonObject {
  return {
    owner_gate: result.owner_gate,
    owner_gate_reason: result.reason,
    owner_gate_version: result.version,
  };
}
