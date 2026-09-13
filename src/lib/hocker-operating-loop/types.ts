import { z } from "zod";

export const WorkSessionStateSchema = z.enum([
  "planning",
  "researching",
  "ready",
  "awaiting_owner",
  "approved",
  "executing",
  "verifying",
  "completed",
  "blocked",
  "failed",
  "canceled",
]);
export type WorkSessionState = z.infer<typeof WorkSessionStateSchema>;

export const ResearchRecordSchema = z.object({
  source_id: z.string().min(1).max(200),
  title: z.string().min(1).max(500),
  url: z.string().url(),
  publisher: z.string().min(1).max(300),
  version: z.string().max(200).nullable().optional(),
  published_at: z.string().datetime().nullable().optional(),
  consulted_at: z.string().datetime(),
  scope: z.string().min(1).max(1000),
  relevance: z.string().min(1).max(2000),
  impact: z.string().min(1).max(3000),
  risk_notes: z.string().max(3000).nullable().optional(),
});
export type ResearchRecord = z.infer<typeof ResearchRecordSchema>;

export const ExecutionCandidateSchema = z.object({
  candidate_id: z.string().min(1).max(200),
  work_session_id: z.string().uuid(),
  project_id: z.string().min(1).max(100),
  objective: z.string().min(1).max(4000),
  capability_keys: z.array(z.string().min(1)).max(16),
  primary_agi: z.string().min(1).max(100),
  support_agis: z.array(z.string().min(1)).max(16),
  tools: z.array(z.string().min(1)).max(96),
  providers: z.array(z.string().min(1)).max(32),
  research: z.array(ResearchRecordSchema).max(64),
  repository_sha: z.string().regex(/^[a-f0-9]{40}$/i).nullable().optional(),
  migration_head: z.string().max(200).nullable().optional(),
  runtime_revision: z.string().max(300).nullable().optional(),
  checks: z.array(z.object({ name: z.string().min(1), status: z.enum(["pass", "fail", "unknown"]), detail: z.string().max(2000).optional() })).max(64),
  security_status: z.enum(["pass", "fail", "unknown"]),
  rollback: z.string().min(1).max(3000),
  expected_cost: z.number().nonnegative().nullable().optional(),
  affected_systems: z.array(z.string().min(1)).max(64),
  execution_scope: z.array(z.string().min(1)).max(64),
  risk: z.enum(["R0", "R1", "R2", "R3", "R4"]),
  candidate_hash: z.string().regex(/^[a-f0-9]{64}$/i),
});
export type ExecutionCandidate = z.infer<typeof ExecutionCandidateSchema>;

export const ApprovalEnvelopeSchema = z.object({
  approval_id: z.string().min(1).max(200),
  work_session_id: z.string().uuid(),
  candidate_hash: z.string().regex(/^[a-f0-9]{64}$/i),
  project_id: z.string().min(1).max(100),
  execution_scope: z.array(z.string().min(1)).max(64),
  owner_user_id: z.string().min(1).max(200),
  aal2_evidence_id: z.string().min(1).max(200),
  issued_at: z.string().datetime(),
  expires_at: z.string().datetime(),
});
export type ApprovalEnvelope = z.infer<typeof ApprovalEnvelopeSchema>;

export const WorkSessionEnvelopeSchema = z.object({
  work_session_id: z.string().uuid(),
  project_id: z.string().min(1).max(100),
  thread_id: z.string().uuid().nullable().optional(),
  mission_id: z.string().max(200).nullable().optional(),
  state: WorkSessionStateSchema,
  candidate_id: z.string().max(200).nullable().optional(),
  run_id: z.string().uuid().nullable().optional(),
  task_id: z.string().uuid().nullable().optional(),
  action_id: z.string().uuid().nullable().optional(),
  evidence_id: z.string().uuid().nullable().optional(),
  updated_at: z.string().datetime(),
});
export type WorkSessionEnvelope = z.infer<typeof WorkSessionEnvelopeSchema>;
