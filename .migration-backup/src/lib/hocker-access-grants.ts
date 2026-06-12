import { timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import type { JsonObject } from "@/lib/types";

export const HOCKER_ACCESS_GRANTS_VERSION = "hocker-access-grants-v0.1.0";

export const HOCKER_ACCESS_GRANT_EVENTS = {
  request: "access.portal_grant_request",
  decision: "access.portal_grant_decision",
  revoke: "access.portal_grant_revoke",
} as const;

export type HockerGrantDecision = "approved" | "rejected";

export function asRecord(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
}

export function asText(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

export function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => String(item ?? "").trim()).filter(Boolean)
    : [];
}

function safeEqual(a: string, b: string): boolean {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  if (aa.length !== bb.length) return false;
  return timingSafeEqual(aa, bb);
}

export function validateOwnerActionKey(req: NextRequest) {
  const required = String(process.env.HOCKER_OWNER_ACTION_KEY || "").trim();
  const provided = String(req.headers.get("x-hocker-owner-key") || "").trim();

  if (!required) {
    return {
      ok: false,
      reason: "owner_action_key_not_configured",
      owner_gate: "blocked",
    };
  }

  if (!provided) {
    return {
      ok: false,
      reason: "owner_action_key_missing",
      owner_gate: "blocked",
    };
  }

  const ok = safeEqual(provided, required);

  return {
    ok,
    reason: ok ? "owner_action_key_valid" : "owner_action_key_invalid",
    owner_gate: ok ? "verified" : "blocked",
  };
}

export function buildGrantAuditBase(args: {
  trace_id: string;
  requested_by: string;
  reason: string;
}) {
  return {
    trace_id: args.trace_id,
    requested_by: args.requested_by,
    reason: args.reason,
    version: HOCKER_ACCESS_GRANTS_VERSION,
    dry_run: true,
    executed: false,
    real_execution_enabled: false,
    execution_lock: true,
    creates_real_session: false,
  } as JsonObject;
}
