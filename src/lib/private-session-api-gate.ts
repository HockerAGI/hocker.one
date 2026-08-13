import "server-only";

import { NextResponse, type NextRequest } from "next/server";
import { validateHockerOwnerApiGate } from "@/lib/hocker-owner-api-gate";
import { createServerSupabase } from "@/lib/supabase-server";

export const HOCKER_PRIVATE_API_GATE_VERSION = "hocker-private-api-gate-v0.1.0";

const PRIVATE_ROLES = new Set(["owner", "admin", "operator"]);

type PrivateApiActor = "owner" | "admin" | "operator" | "internal";

export type PrivateApiGateResult =
  | {
      ok: true;
      actor: PrivateApiActor;
      userId?: string;
      version: string;
      authentication: "supabase-session" | "internal-key";
    }
  | {
      ok: false;
      response: NextResponse;
    };

function blocked(status: number, reason: string): PrivateApiGateResult {
  return {
    ok: false,
    response: NextResponse.json(
      {
        ok: false,
        private_access: "blocked",
        reason,
        gate_version: HOCKER_PRIVATE_API_GATE_VERSION,
      },
      { status },
    ),
  };
}

export async function requirePrivateReadApi(
  request: NextRequest,
  projectId = "hocker-one",
): Promise<PrivateApiGateResult> {
  const legacyGate = validateHockerOwnerApiGate(request);
  if (legacyGate.ok && legacyGate.actor === "internal") {
    return {
      ok: true,
      actor: "internal",
      version: HOCKER_PRIVATE_API_GATE_VERSION,
      authentication: "internal-key",
    };
  }

  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      return blocked(401, "private_session_required");
    }

    const { data: membership, error: membershipError } = await supabase
      .from("project_members")
      .select("role")
      .eq("project_id", projectId)
      .eq("user_id", data.user.id)
      .maybeSingle();

    const role = String(membership?.role ?? "").trim().toLowerCase();
    if (membershipError || !PRIVATE_ROLES.has(role)) {
      return blocked(403, "private_role_required");
    }

    return {
      ok: true,
      actor: role as "owner" | "admin" | "operator",
      userId: data.user.id,
      version: HOCKER_PRIVATE_API_GATE_VERSION,
      authentication: "supabase-session",
    };
  } catch {
    return blocked(503, "private_session_gate_unavailable");
  }
}
