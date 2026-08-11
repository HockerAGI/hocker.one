import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireOwnerAal2Api } from "@/lib/owner-session-gate";
import { createAdminSupabase } from "@/lib/supabase-admin";
import type { JsonObject } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AdminAction =
  | "kyc_approve"
  | "kyc_reject"
  | "deposit_confirm"
  | "deposit_reject"
  | "withdraw_approve"
  | "withdraw_reject"
  | "games_pause"
  | "games_resume"
  | "settings_update";

const VALID_ACTIONS = new Set<AdminAction>([
  "kyc_approve",
  "kyc_reject",
  "deposit_confirm",
  "deposit_reject",
  "withdraw_approve",
  "withdraw_reject",
  "games_pause",
  "games_resume",
  "settings_update",
]);

function asText(value: unknown, fallback = "") {
  const text = value === null || value === undefined ? "" : String(value).trim();
  return text || fallback;
}

function asRecord(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : {};
}

async function logAudit(
  sb: ReturnType<typeof createAdminSupabase>,
  params: {
    action: AdminAction;
    traceId: string;
    targetId?: string;
    reason?: string;
    actor: string;
    result: "success" | "error";
    error?: string;
    details?: JsonObject;
  }
) {
  try {
    await sb.from("events").insert({
      project_id: "chido-casino",
      level: params.result === "success" ? "info" : "error",
      type: `chido.admin.${params.action}`,
      message: `Hocker ONE admin: ${params.action} — ${params.result}`,
      data: {
        trace_id: params.traceId,
        action: params.action,
        target_id: params.targetId ?? null,
        reason: params.reason ?? null,
        actor: params.actor,
        result: params.result,
        error: params.error ?? null,
        details: params.details ?? {},
        source: "hocker.one",
        route: "/api/chido/admin",
        timestamp: new Date().toISOString(),
      } as JsonObject,
    });
  } catch (error) {
    console.warn("Chido admin audit write failed", error);
  }
}

function rpcFailure(error: string, traceId: string, status = 500) {
  return NextResponse.json({ ok: false, trace_id: traceId, error }, { status });
}

export async function POST(req: NextRequest) {
  const traceId = randomUUID();
  const ownerGate = await requireOwnerAal2Api();
  if (!ownerGate.ok) return ownerGate.response;

  const raw = await req.json().catch(() => ({}));
  const action = asText(raw?.action) as AdminAction;
  const targetId = asText(raw?.target_id);
  const reason = asText(raw?.reason);
  const settings = asRecord(raw?.settings);

  if (!VALID_ACTIONS.has(action)) {
    return NextResponse.json({ ok: false, trace_id: traceId, error: "INVALID_ACTION" }, { status: 400 });
  }

  const sb = createAdminSupabase();
  const actor = `hocker-owner:${ownerGate.userId}`;

  try {
    if (action === "kyc_approve" || action === "kyc_reject") {
      if (!targetId) return rpcFailure("TARGET_ID_REQUIRED", traceId, 400);
      const status = action === "kyc_approve" ? "approved" : "rejected";
      const profileStatus = action === "kyc_approve" ? "verified" : "rejected";

      const { data: request, error } = await sb
        .from("kyc_requests")
        .update({
          status,
          reviewed_at: new Date().toISOString(),
          review_note: reason || `Reviewed by Hocker ONE (${action})`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", targetId)
        .select("id,user_id,status")
        .single();

      if (error) {
        await logAudit(sb, { action, traceId, targetId, reason, actor, result: "error", error: error.message });
        return rpcFailure("KYC_UPDATE_FAILED", traceId);
      }

      if (request?.user_id) {
        const { error: profileError } = await sb
          .from("profiles")
          .update({ kyc_status: profileStatus, updated_at: new Date().toISOString() })
          .eq("user_id", request.user_id);
        if (profileError) throw new Error("KYC_PROFILE_UPDATE_FAILED");
      }

      await logAudit(sb, { action, traceId, targetId, reason, actor, result: "success" });
      return NextResponse.json({ ok: true, trace_id: traceId, action, kyc_request_id: targetId, status, user_id: request?.user_id });
    }

    if (action === "deposit_confirm" || action === "deposit_reject") {
      if (!targetId) return rpcFailure("TARGET_ID_REQUIRED", traceId, 400);
      const { data: request, error: lookupError } = await sb
        .from("manual_deposit_requests")
        .select("id,folio,amount,user_id,status")
        .eq("id", targetId)
        .maybeSingle();
      if (lookupError || !request?.folio) return rpcFailure("DEPOSIT_REQUEST_NOT_FOUND", traceId, 404);

      const { data, error } = await sb.rpc("admin_confirm_manual_deposit", {
        p_folio: request.folio,
        p_amount: null,
        p_ref_id: `manual_deposit:${request.folio}`,
        p_status: action === "deposit_confirm" ? "approved" : "rejected",
        p_reason: reason || null,
        p_meta: {
          reviewed_by: actor,
          trace_id: traceId,
          source: "hocker.one",
          target_id: targetId,
        },
      });

      if (error || !(data as any)?.ok) {
        const code = error?.message || String((data as any)?.error || "DEPOSIT_SETTLEMENT_FAILED");
        await logAudit(sb, { action, traceId, targetId, reason, actor, result: "error", error: code });
        return rpcFailure("DEPOSIT_SETTLEMENT_FAILED", traceId, 409);
      }

      await logAudit(sb, { action, traceId, targetId, reason, actor, result: "success", details: data as JsonObject });
      return NextResponse.json({ ...(data as object), trace_id: traceId, action });
    }

    if (action === "withdraw_approve" || action === "withdraw_reject") {
      if (!targetId) return rpcFailure("TARGET_ID_REQUIRED", traceId, 400);
      const { data: request, error: lookupError } = await sb
        .from("withdraw_requests")
        .select("id,external_id,status")
        .eq("id", targetId)
        .maybeSingle();
      if (lookupError || !request) return rpcFailure("WITHDRAW_REQUEST_NOT_FOUND", traceId, 404);

      const externalId = asText(request.external_id, request.id);
      const finalAction = action === "withdraw_approve" ? "paid" : "reject";
      const { data, error } = await sb.rpc("admin_settle_withdrawal", {
        p_external_id: externalId,
        p_final_action: finalAction,
        p_provider_payload: { source: "hocker.one", trace_id: traceId },
        p_note: reason || null,
        p_idempotency_key: `withdraw_settle:${externalId}:${finalAction}`,
      });

      if (error || !(data as any)?.ok) {
        const code = error?.message || String((data as any)?.error || "WITHDRAW_SETTLEMENT_FAILED");
        await logAudit(sb, { action, traceId, targetId, reason, actor, result: "error", error: code });
        return rpcFailure("WITHDRAW_SETTLEMENT_FAILED", traceId, 409);
      }

      await logAudit(sb, { action, traceId, targetId, reason, actor, result: "success", details: data as JsonObject });
      return NextResponse.json({ ...(data as object), trace_id: traceId, action });
    }

    if (action === "games_pause" || action === "games_resume") {
      const killSwitch = action === "games_pause";
      const { error } = await sb.from("system_controls").upsert(
        {
          id: "chido-casino-games",
          project_id: "chido-casino",
          kill_switch: killSwitch,
          allow_write: !killSwitch,
          meta: {
            last_updated_by: actor,
            last_updated_at: new Date().toISOString(),
            reason: reason || (killSwitch ? "Games paused by Hocker ONE" : "Games resumed by Hocker ONE"),
            source: "hocker.one",
            trace_id: traceId,
            fail_closed: true,
          } as JsonObject,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "project_id,id" }
      );

      if (error) {
        await logAudit(sb, { action, traceId, reason, actor, result: "error", error: error.message });
        return rpcFailure("CONTROL_UPDATE_FAILED", traceId);
      }

      await logAudit(sb, { action, traceId, reason, actor, result: "success" });
      return NextResponse.json({ ok: true, trace_id: traceId, action, kill_switch: killSwitch });
    }

    const allowedFields = new Set([
      "cashback_daily_cap",
      "cashback_weekly_cap",
      "cashback_lookback_days",
      "cashback_wager_multiplier",
      "free_rounds_wager_multiplier",
      "promo_bonus_wager_multiplier",
    ]);
    const safeSettings = Object.fromEntries(
      Object.entries(settings).filter(([key, value]) => allowedFields.has(key) && Number.isFinite(Number(value)))
    );
    if (Object.keys(safeSettings).length === 0) return rpcFailure("NO_VALID_SETTINGS", traceId, 400);

    const { data, error } = await sb
      .from("casino_settings")
      .update({ ...safeSettings, updated_at: new Date().toISOString() })
      .eq("id", 1)
      .select("*")
      .single();
    if (error) {
      await logAudit(sb, { action, traceId, actor, result: "error", error: error.message });
      return rpcFailure("SETTINGS_UPDATE_FAILED", traceId);
    }

    await logAudit(sb, { action, traceId, actor, result: "success", details: safeSettings as JsonObject });
    return NextResponse.json({ ok: true, trace_id: traceId, action, settings: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "INTERNAL_ERROR";
    console.error("Hocker ONE Chido admin error", { traceId, action, message });
    await logAudit(sb, { action, traceId, targetId, reason, actor, result: "error", error: message });
    return rpcFailure("INTERNAL_ERROR", traceId);
  }
}
