import { timingSafeEqual } from "crypto";
import { NextResponse, type NextRequest } from "next/server";

export const HOCKER_OWNER_API_GATE_VERSION = "hocker-owner-api-gate-v0.2.2";

type Actor = "owner" | "internal" | "unknown";
type HeaderName = "x-hocker-owner-key" | "x-hocker-internal-key" | "authorization";

export type HockerOwnerGateResult = {
  ok: boolean;
  status: number;
  reason: string;
  owner_gate: "verified" | "blocked";
  actor: Actor;
  version: string;
  accepted_header?: HeaderName;
};

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function safeEqual(a: string, b: string): boolean {
  if (!a || !b) return false;
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  if (aa.length !== bb.length) return false;
  return timingSafeEqual(aa, bb);
}

function bearer(req: NextRequest): string {
  const value = clean(req.headers.get("authorization"));
  return value.startsWith("Bearer ") ? clean(value.slice(7)) : "";
}

function tokens(): { owner: string; internal: string[] } {
  const owner = clean(process.env.HOCKER_OWNER_ACTION_KEY);
  const internal = [
    process.env.HOCKER_ONE_INTERNAL_TOKEN,
    process.env.HOCKER_COMMAND_HMAC_SECRET,
    process.env.NOVA_ORCHESTRATOR_KEY,
    process.env.COMMAND_HMAC_SECRET,
  ].map(clean).filter(Boolean);

  return { owner, internal: Array.from(new Set(internal)) };
}

function matchAny(value: string, list: string[]): boolean {
  return list.some((token) => safeEqual(value, token));
}

function verified(
  actor: Actor,
  reason: string,
  accepted_header: HeaderName,
): HockerOwnerGateResult {
  return {
    ok: true,
    status: 200,
    reason,
    owner_gate: "verified",
    actor,
    accepted_header,
    version: HOCKER_OWNER_API_GATE_VERSION,
  };
}

function blocked(status: number, reason: string): HockerOwnerGateResult {
  return {
    ok: false,
    status,
    reason,
    owner_gate: "blocked",
    actor: "unknown",
    version: HOCKER_OWNER_API_GATE_VERSION,
  };
}

export function validateHockerOwnerApiGate(req: NextRequest): HockerOwnerGateResult {
  const configured = tokens();
  const ownerHeader = clean(req.headers.get("x-hocker-owner-key"));
  const internalHeader = clean(req.headers.get("x-hocker-internal-key"));
  const bearerToken = bearer(req);

  if (!configured.owner && configured.internal.length === 0) {
    return blocked(503, "owner_or_internal_gate_not_configured");
  }

  if (ownerHeader && safeEqual(ownerHeader, configured.owner)) {
    return verified("owner", "owner_key_valid", "x-hocker-owner-key");
  }

  if (internalHeader && matchAny(internalHeader, configured.internal)) {
    return verified("internal", "internal_key_valid", "x-hocker-internal-key");
  }

  if (bearerToken && matchAny(bearerToken, configured.internal)) {
    return verified("internal", "internal_bearer_valid", "authorization");
  }

  return blocked(
    401,
    ownerHeader || internalHeader || bearerToken
      ? "owner_or_internal_key_invalid"
      : "owner_or_internal_key_missing",
  );
}

export function requireOwnerOrInternal(
  req: NextRequest,
  traceId?: string,
): NextResponse | null {
  const result = validateHockerOwnerApiGate(req);
  if (result.ok) return null;

  return NextResponse.json(
    {
      ok: false,
      trace_id: traceId ?? null,
      executed: false,
      real_execution_enabled: false,
      execution_lock: true,
      owner_gate: result.owner_gate,
      owner_gate_actor: result.actor,
      owner_gate_reason: result.reason,
      owner_gate_version: result.version,
      message: "Owner/internal gate rejected the request.",
    },
    { status: result.status },
  );
}
