import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
import { createAdminSupabase } from "@/lib/supabase-admin";
import type { JsonObject } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Chido Casino Admin Controls API
 *
 * Provides real admin operations from Hocker ONE:
 *   - KYC: approve / reject
 *   - Manual deposits: confirm / reject
 *   - Withdrawals: approve / reject
 *   - Game kill-switch: pause / resume
 *   - Casino settings: update cashback caps, wager multipliers
 *
 * All mutations are protected by the Hocker owner/internal API gate
 * and use the Supabase service role key. Every action is logged to
 * the events table with a full audit trail.
 */

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

const VALID_ACTIONS: AdminAction[] = [
  "kyc_approve",
  "kyc_reject",
  "deposit_confirm",
  "deposit_reject",
  "withdraw_approve",
  "withdraw_reject",
  "games_pause",
  "games_resume",
  "settings_update",
];

function asText(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  const text = String(value).trim();
  return text ? text : fallback;
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
  },
): Promise<void> {
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
        source: "hocker.one",
        route: "/api/chido/admin",
        timestamp: new Date().toISOString(),
      } as JsonObject,
    });
  } catch {
    // Audit logging is best-effort — don't fail the operation if logging fails
  }
}

export async function POST(req: NextRequest) {
  const traceId = randomUUID();

  // 1) Owner/Internal API gate
  const ownerGateResponse = requireOwnerOrInternal(req, traceId);
  if (ownerGateResponse) return ownerGateResponse;

  // 2) Parse and validate body
  const raw = await req.json().catch(() => ({}));
  const action = asText(raw?.action) as AdminAction;
  const targetId = asText(raw?.target_id);
  const reason = asText(raw?.reason);
  const settings = asRecord(raw?.settings);

  if (!VALID_ACTIONS.includes(action)) {
    return NextResponse.json(
      {
        ok: false,
        trace_id: traceId,
        error: `Acción inválida. Acciones válidas: ${VALID_ACTIONS.join(", ")}`,
      },
      { status: 400 },
    );
  }

  const sb = createAdminSupabase();
  const actor = "hocker-owner";

  try {
    // ---- KYC MANAGEMENT ----
    if (action === "kyc_approve" || action === "kyc_reject") {
      if (!targetId) {
        return NextResponse.json(
          { ok: false, trace_id: traceId, error: "target_id (KYC request ID) requerido." },
          { status: 400 },
        );
      }

      const newStatus = action === "kyc_approve" ? "approved" : "rejected";
      const profileKycStatus = action === "kyc_approve" ? "verified" : "rejected";

      // Update KYC request
      const { data: kycUpdate, error: kycError } = await sb
        .from("kyc_requests")
        .update({
          status: newStatus,
          reviewed_at: new Date().toISOString(),
          review_note: reason || `Reviewed by Hocker ONE admin (${action})`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", targetId)
        .select("id, user_id, status")
        .single();

      if (kycError) {
        await logAudit(sb, { action, traceId, targetId, reason, actor, result: "error", error: kycError.message });
        return NextResponse.json(
          { ok: false, trace_id: traceId, error: kycError.message },
          { status: 500 },
        );
      }

      // Update profile kyc_status
      const userId = asText(kycUpdate?.user_id);
      if (userId) {
        await sb
          .from("profiles")
          .update({ kyc_status: profileKycStatus })
          .eq("user_id", userId);
      }

      await logAudit(sb, { action, traceId, targetId, reason, actor, result: "success" });
      return NextResponse.json({
        ok: true,
        trace_id: traceId,
        action,
        kyc_request_id: targetId,
        new_status: newStatus,
        user_id: userId,
        message: `KYC ${newStatus} successfully.`,
      });
    }

    // ---- MANUAL DEPOSIT MANAGEMENT ----
    if (action === "deposit_confirm" || action === "deposit_reject") {
      if (!targetId) {
        return NextResponse.json(
          { ok: false, trace_id: traceId, error: "target_id (deposit request ID) requerido." },
          { status: 400 },
        );
      }

      const newStatus = action === "deposit_confirm" ? "confirmed" : "rejected";

      const { data: depUpdate, error: depError } = await sb
        .from("manual_deposit_requests")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", targetId)
        .select("id, user_id, status, amount")
        .single();

      if (depError) {
        await logAudit(sb, { action, traceId, targetId, reason, actor, result: "error", error: depError.message });
        return NextResponse.json(
          { ok: false, trace_id: traceId, error: depError.message },
          { status: 500 },
        );
      }

      // If confirming, credit the user's balance
      if (action === "deposit_confirm" && depUpdate) {
        const userId = asText(depUpdate.user_id);
        const amount = Number(depUpdate.amount ?? 0);

        if (userId && amount > 0) {
          // Credit balance
          const { data: balanceRow } = await sb
            .from("balances")
            .select("balance, bonus_balance")
            .eq("user_id", userId)
            .maybeSingle();

          const currentBalance = Number(balanceRow?.balance ?? 0);
          await sb
            .from("balances")
            .upsert({
              user_id: userId,
              balance: currentBalance + amount,
              updated_at: new Date().toISOString(),
            });

          // Record transaction
          await sb.from("transactions").insert({
            user_id: userId,
            amount: amount,
            type: "deposit",
            status: "confirmed",
            method: "manual",
            reason: `Manual deposit confirmed by Hocker ONE admin`,
            ref_id: targetId,
            metadata: { admin_action: action, trace_id: traceId, source: "hocker.one" } as JsonObject,
          });
        }
      }

      await logAudit(sb, { action, traceId, targetId, reason, actor, result: "success" });
      return NextResponse.json({
        ok: true,
        trace_id: traceId,
        action,
        deposit_request_id: targetId,
        new_status: newStatus,
        message: `Depósito ${newStatus} successfully.`,
      });
    }

    // ---- WITHDRAWAL MANAGEMENT ----
    if (action === "withdraw_approve" || action === "withdraw_reject") {
      if (!targetId) {
        return NextResponse.json(
          { ok: false, trace_id: traceId, error: "target_id (withdrawal request ID) requerido." },
          { status: 400 },
        );
      }

      const newStatus = action === "withdraw_approve" ? "approved" : "rejected";

      const { data: wdUpdate, error: wdError } = await sb
        .from("withdraw_requests")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", targetId)
        .select("id, user_id, status, amount")
        .single();

      if (wdError) {
        await logAudit(sb, { action, traceId, targetId, reason, actor, result: "error", error: wdError.message });
        return NextResponse.json(
          { ok: false, trace_id: traceId, error: wdError.message },
          { status: 500 },
        );
      }

      // If rejecting a withdrawal, return the locked balance to the user
      if (action === "withdraw_reject" && wdUpdate) {
        const userId = asText(wdUpdate.user_id);
        const amount = Number(wdUpdate.amount ?? 0);

        if (userId && amount > 0) {
          const { data: balanceRow } = await sb
            .from("balances")
            .select("balance, locked_balance")
            .eq("user_id", userId)
            .maybeSingle();

          const currentBalance = Number(balanceRow?.balance ?? 0);
          const currentLocked = Number(balanceRow?.locked_balance ?? 0);

          await sb
            .from("balances")
            .upsert({
              user_id: userId,
              balance: currentBalance + amount,
              locked_balance: Math.max(0, currentLocked - amount),
              updated_at: new Date().toISOString(),
            });
        }
      }

      await logAudit(sb, { action, traceId, targetId, reason, actor, result: "success" });
      return NextResponse.json({
        ok: true,
        trace_id: traceId,
        action,
        withdrawal_request_id: targetId,
        new_status: newStatus,
        message: `Retiro ${newStatus} successfully.`,
      });
    }

    // ---- GAME KILL-SWITCH (PAUSE / RESUME) ----
    if (action === "games_pause" || action === "games_resume") {
      const killSwitch = action === "games_pause";

      const { error: ctrlError } = await sb
        .from("system_controls")
        .upsert({
          id: "chido-casino-games",
          project_id: "chido-casino",
          kill_switch: killSwitch,
          allow_write: !killSwitch,
          meta: {
            last_updated_by: actor,
            last_updated_at: new Date().toISOString(),
            reason: reason || (killSwitch ? "Games paused by Hocker ONE admin" : "Games resumed by Hocker ONE admin"),
            source: "hocker.one",
            trace_id: traceId,
          } as JsonObject,
          updated_at: new Date().toISOString(),
        });

      if (ctrlError) {
        await logAudit(sb, { action, traceId, reason, actor, result: "error", error: ctrlError.message });
        return NextResponse.json(
          { ok: false, trace_id: traceId, error: ctrlError.message },
          { status: 500 },
        );
      }

      await logAudit(sb, { action, traceId, reason, actor, result: "success" });
      return NextResponse.json({
        ok: true,
        trace_id: traceId,
        action,
        kill_switch: killSwitch,
        message: killSwitch
          ? "Juegos pausados. El kill-switch está activo."
          : "Juegos reanudados. El kill-switch está desactivado.",
      });
    }

    // ---- CASINO SETTINGS UPDATE ----
    if (action === "settings_update") {
      const allowedFields = [
        "cashback_daily_cap",
        "cashback_weekly_cap",
        "cashback_lookback_days",
        "cashback_wager_multiplier",
        "free_rounds_wager_multiplier",
        "promo_bonus_wager_multiplier",
      ];

      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
      for (const field of allowedFields) {
        if (settings[field] !== undefined) {
          updateData[field] = settings[field];
        }
      }

      if (Object.keys(updateData).length <= 1) {
        return NextResponse.json(
          { ok: false, trace_id: traceId, error: "No se proporcionaron campos válidos para actualizar." },
          { status: 400 },
        );
      }

      const { error: settingsError } = await sb
        .from("casino_settings")
        .update(updateData)
        .eq("id", 1);

      if (settingsError) {
        await logAudit(sb, { action, traceId, reason, actor, result: "error", error: settingsError.message });
        return NextResponse.json(
          { ok: false, trace_id: traceId, error: settingsError.message },
          { status: 500 },
        );
      }

      await logAudit(sb, { action, traceId, reason, actor, result: "success" });
      return NextResponse.json({
        ok: true,
        trace_id: traceId,
        action,
        updated_fields: Object.keys(updateData).filter((k) => k !== "updated_at"),
        message: "Configuración del casino actualizada.",
      });
    }

    // Should not reach here
    return NextResponse.json(
      { ok: false, trace_id: traceId, error: "Acción no manejada." },
      { status: 400 },
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Error desconocido";
    await logAudit(sb, { action, traceId, targetId, reason, actor, result: "error", error: errorMsg });
    return NextResponse.json(
      { ok: false, trace_id: traceId, error: errorMsg },
      { status: 500 },
    );
  }
}
