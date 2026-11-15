import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireOwnerAal2Api } from "@/lib/owner-session-gate";
import { reconcileProjectContinuity } from "@/lib/project-continuity";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const Params = z.object({
  project_id: z.literal("hocker-one"),
  confirm: z.literal(true),
}).strict();

export async function POST(req: NextRequest): Promise<NextResponse> {
  const gate = await requireOwnerAal2Api("hocker-one");
  if (!gate.ok) return gate.response;

  // Current Owner session, same origin and explicit confirmation. No CRON_SECRET
  // copied into the browser and no scheduled/internal bypass of MFA.
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  let sameOrigin = false;
  try {
    sameOrigin = Boolean(origin && host && new URL(origin).host === host);
  } catch {
    sameOrigin = false;
  }
  if (!sameOrigin) return NextResponse.json(
    { ok: false, reconciled: false, error: "CONTEXT_OWNER_ORIGIN_REJECTED" },
    { status: 403 },
  );

  const parsed = Params.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json(
    { ok: false, reconciled: false, error: "CONTEXT_OWNER_CONFIRM_REQUIRED" },
    { status: 400 },
  );

  try {
    const actual = await reconcileProjectContinuity();
    return NextResponse.json({
      ...actual,
      owner_mfa_aal2_verified: true,
      manifest_activated: false,
      external_provider_mutations: false,
      source: "owner_explicit_refresh",
    }, {
      status: actual.ok ? 200 : 503,
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch {
    return NextResponse.json({
      ok: false, reconciled: false,
      error: "CONTEXT_OWNER_RECONCILIATION_UNAVAILABLE",
      manifest_activated: false,
    }, { status: 503 });
  }
}
