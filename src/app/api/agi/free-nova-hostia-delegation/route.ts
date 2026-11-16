import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireOwnerAal2Api } from "@/lib/owner-session-gate";
import { CF_FREE_MODEL } from "@/lib/cloudflare-zero-credit-policy";
import {
  freeNovaHostiaDelegationConfigured, readFreeNovaHostiaDelegation,
  runOneFreeNovaHostiaDelegation,
} from "@/lib/agi-free-delegation-canary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 90;
const PROJECT = "hocker-one";
const Body = z.object({ project_id: z.literal("hocker-one"), confirm: z.literal(true) }).strict();
function response(value: Record<string, unknown>, status = 200) {
  return NextResponse.json(value, { status, headers: { "Cache-Control": "no-store, max-age=0" } });
}
export async function GET() {
  const owner = await requireOwnerAal2Api(PROJECT);
  if (!owner.ok) return owner.response;
  try {
    const state = await readFreeNovaHostiaDelegation();
    return response({ ok: true, configured: freeNovaHostiaDelegationConfigured(), ...state,
      can_authorize: freeNovaHostiaDelegationConfigured() && !state.already_started,
      model: CF_FREE_MODEL, no_tools: true, no_autonomous_dispatch: true });
  } catch {
    return response({ ok: false, error: "FREE_DELEGATION_STATUS_UNAVAILABLE" }, 503);
  }
}
export async function POST(request: NextRequest) {
  const owner = await requireOwnerAal2Api(PROJECT);
  if (!owner.ok) return owner.response;
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  let sameOrigin = false;
  try { sameOrigin = Boolean(origin && host && new URL(origin).host === host); }
  catch { sameOrigin = false; }
  if (!sameOrigin) return response({ ok: false, error: "FREE_DELEGATION_ORIGIN_REJECTED" }, 403);
  if (!Body.safeParse(await request.json().catch(() => null)).success) {
    return response({ ok: false, error: "FREE_DELEGATION_CONFIRMATION_REQUIRED" }, 400);
  }
  if (!freeNovaHostiaDelegationConfigured()) {
    return response({ ok: false, error: "FREE_DELEGATION_CONFIG_DISABLED" }, 409);
  }
  try {
    const result = await runOneFreeNovaHostiaDelegation(owner.userId);
    return response(result);
  } catch (error) {
    const code = error instanceof Error ? error.message : "FREE_DELEGATION_EXECUTION_UNVERIFIED";
    return response({ ok: false, error: /^FREE_DELEGATION_[A-Z_]+$/.test(code)
      ? code : "FREE_DELEGATION_EXECUTION_UNVERIFIED",
      no_autonomous_dispatch: true, no_paid_fallback: true,
      message: "Revisar los dos estados persistidos antes de cualquier otra acción; no repetir inferencias." }, 409);
  }
}
