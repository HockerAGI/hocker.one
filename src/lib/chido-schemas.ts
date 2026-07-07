/**
 * Hocker ONE — Chido Action Zod Schemas
 *
 * Centralized input validation for all Chido action endpoints.
 * Replaces manual asText/asBool guards with strict Zod parsing.
 */

import { z } from "zod";

/** Schema for chido/actions/dry-run POST */
export const ChidoDryRunSchema = z.object({
  action: z.string().min(1, "Falta action."),
  target_id: z.string().optional().default(""),
  reason: z.string().optional().default(""),
  requested_by: z.string().optional().default("hocker-one"),
  payload: z.unknown().optional(),
});

/** Schema for chido/actions/approval/request POST */
export const ChidoApprovalRequestSchema = z.object({
  action: z.string().min(1, "Falta action."),
  target_id: z.string().optional().default(""),
  reason: z.string().optional().default(""),
  requested_by: z.string().optional().default("hocker-one"),
});

/** Schema for chido/actions/approval/decision POST */
export const ChidoApprovalDecisionSchema = z.object({
  approval_request_id: z.string().min(1, "Falta approval_request_id."),
  decision: z.enum(["approved", "rejected"], {
    errorMap: () => ({ message: "decision debe ser approved o rejected." }),
  }),
  guardian_agi: z.string().min(1, "Falta guardian_agi."),
  reason: z.string().optional().default(""),
  decided_by: z.string().optional().default("hocker-one"),
});

/** Schema for chido/actions/execution/preflight POST */
export const ChidoExecutionPreflightSchema = z.object({
  approval_request_id: z.string().min(1, "Falta approval_request_id."),
  requested_by: z.string().optional().default("hocker-one"),
});

/** Schema for chido/actions/signature/check POST */
export const ChidoSignatureCheckSchema = z.object({
  approval_request_id: z.string().min(1, "Falta approval_request_id."),
  timestamp: z.string().min(1, "Falta timestamp."),
  nonce: z.string().min(1, "Falta nonce."),
  signature: z.string().min(1, "Falta signature."),
  requested_by: z.string().optional().default("hocker-one"),
});
