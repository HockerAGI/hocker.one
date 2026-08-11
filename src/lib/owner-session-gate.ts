import "server-only";

import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export const HOCKER_OWNER_SESSION_GATE_VERSION = "hocker-owner-session-gate-v0.1.1";

type AuthenticatorAssuranceLevel = "aal1" | "aal2" | null;

type OwnerSessionState = {
  ok: boolean;
  status: number;
  reason: string;
  userId: string | null;
  email: string | null;
  role: "owner" | null;
  currentLevel: AuthenticatorAssuranceLevel;
  nextLevel: AuthenticatorAssuranceLevel;
};

type OwnerAal2ApiResult =
  | {
      ok: true;
      response: null;
      userId: string;
      email: string | null;
      currentLevel: "aal2";
      version: string;
    }
  | {
      ok: false;
      response: NextResponse;
      userId: string | null;
      email: string | null;
      currentLevel: AuthenticatorAssuranceLevel;
      version: string;
    };

function normalizeAal(value: unknown): AuthenticatorAssuranceLevel {
  return value === "aal1" || value === "aal2" ? value : null;
}

function missingAuthEnvironment(): OwnerSessionState {
  return {
    ok: false,
    status: 503,
    reason: "owner_auth_not_configured",
    userId: null,
    email: null,
    role: null,
    currentLevel: null,
    nextLevel: null,
  };
}

export function sanitizeOwnerReturnTo(value: unknown): string {
  const candidate = String(value ?? "").trim();
  if (!candidate.startsWith("/") || candidate.startsWith("//")) {
    return "/owner";
  }
  return candidate;
}

async function inspectOwnerSession(projectId = "hocker-one"): Promise<OwnerSessionState> {
  const url = String(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim();
  const anonKey = String(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();
  if (!url || !anonKey) {
    return missingAuthEnvironment();
  }

  const supabase = await createServerSupabase();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData.user;

  if (userError || !user) {
    return {
      ok: false,
      status: 401,
      reason: "owner_session_required",
      userId: null,
      email: null,
      role: null,
      currentLevel: null,
      nextLevel: null,
    };
  }

  const { data: membership, error: membershipError } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();

  const role = String(membership?.role ?? "").trim().toLowerCase();
  if (membershipError || role !== "owner") {
    return {
      ok: false,
      status: 403,
      reason: "owner_role_required",
      userId: user.id,
      email: user.email ?? null,
      role: null,
      currentLevel: null,
      nextLevel: null,
    };
  }

  const { data: assurance, error: assuranceError } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (assuranceError) {
    return {
      ok: false,
      status: 503,
      reason: "owner_mfa_state_unavailable",
      userId: user.id,
      email: user.email ?? null,
      role: "owner",
      currentLevel: null,
      nextLevel: null,
    };
  }

  return {
    ok: true,
    status: 200,
    reason: "owner_session_valid",
    userId: user.id,
    email: user.email ?? null,
    role: "owner",
    currentLevel: normalizeAal(assurance.currentLevel),
    nextLevel: normalizeAal(assurance.nextLevel),
  };
}

export async function requireOwnerSessionPage(projectId = "hocker-one") {
  const state = await inspectOwnerSession(projectId);

  if (!state.ok) {
    if (state.status === 401) redirect("/login?reason=authentication_required");
    if (state.status === 403) redirect("/login?reason=owner_required");
    redirect("/login?reason=mfa_unavailable");
  }

  return state;
}

export async function requireOwnerAal2Page(
  returnTo = "/owner",
  projectId = "hocker-one",
) {
  const state = await requireOwnerSessionPage(projectId);

  if (state.currentLevel !== "aal2") {
    const safeReturnTo = sanitizeOwnerReturnTo(returnTo);
    redirect(`/auth/mfa?returnTo=${encodeURIComponent(safeReturnTo)}`);
  }

  return state;
}

export async function requireOwnerAal2Api(
  projectId = "hocker-one",
): Promise<OwnerAal2ApiResult> {
  const state = await inspectOwnerSession(projectId);

  if (!state.ok) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          executed: false,
          real_execution_enabled: false,
          execution_lock: true,
          owner_gate: "blocked",
          owner_gate_actor: state.role ?? "unknown",
          owner_gate_reason: state.reason,
          owner_gate_version: HOCKER_OWNER_SESSION_GATE_VERSION,
          message: state.status === 503
            ? "Owner authentication is temporarily unavailable."
            : "Authenticated Owner session is required.",
        },
        { status: state.status },
      ),
      userId: state.userId,
      email: state.email,
      currentLevel: state.currentLevel,
      version: HOCKER_OWNER_SESSION_GATE_VERSION,
    };
  }

  if (state.currentLevel !== "aal2") {
    return {
      ok: false,
      response: NextResponse.json(
        {
          ok: false,
          executed: false,
          real_execution_enabled: false,
          execution_lock: true,
          owner_gate: "blocked",
          owner_gate_actor: "owner",
          owner_gate_reason: "owner_mfa_required",
          owner_gate_version: HOCKER_OWNER_SESSION_GATE_VERSION,
          mfa_required: true,
          message: "Owner MFA step-up is required for this action.",
        },
        { status: 403 },
      ),
      userId: state.userId,
      email: state.email,
      currentLevel: state.currentLevel,
      version: HOCKER_OWNER_SESSION_GATE_VERSION,
    };
  }

  return {
    ok: true,
    response: null,
    userId: state.userId!,
    email: state.email,
    currentLevel: "aal2",
    version: HOCKER_OWNER_SESSION_GATE_VERSION,
  };
}
