import {
  getAgiCertificationSnapshot,
  type AgiCertificationSnapshot,
} from "@/lib/agi-certification";
import { runAgiReadOnlyToolProbe } from "@/lib/agi-read-tool-runtime";
import { runAgiEvalSuite } from "@/lib/agi-runtime-eval-runner";

export type AgiCertificationProgress = {
  version: string;
  source: "supabase+code" | "partial";
  total: 16;
  certified: number;
  pending: number;
  runtime_pending: number;
  tool_pending: number;
};

export type AgiCertificationStepResult = {
  ok: boolean;
  complete: boolean;
  halted: boolean;
  retryable: boolean;
  continue_after_ms: number;
  progress: AgiCertificationProgress;
  step: {
    kind: "runtime_eval" | "tool_eval" | "complete" | "blocked";
    agi_id: string | null;
    tool_key: "supabase" | "github" | null;
    passed: boolean | null;
  };
  error?: string;
};

type RunArgs = {
  actor_user_id: string;
  oidc_token?: string | null;
};

const RUNTIME_STEP_DELAY_MS = 10_000;
const TRANSIENT_RETRY_DELAY_MS = 20_000;
const TOOL_STEP_DELAY_MS = 250;
let activeCertificationStep: Promise<AgiCertificationStepResult> | null = null;

function progress(snapshot: AgiCertificationSnapshot): AgiCertificationProgress {
  return {
    version: snapshot.version,
    source: snapshot.source,
    total: 16,
    certified: snapshot.certified,
    pending: snapshot.pending,
    runtime_pending: snapshot.runtime_eval_targets.length,
    tool_pending: snapshot.tool_eval_targets.length,
  };
}

function snapshotGuardError(snapshot: AgiCertificationSnapshot): string | null {
  const ids = snapshot.entries.map((entry) => entry.agi_id);
  if (snapshot.source === "partial") return "agi_certification_snapshot_partial";
  if (ids.length !== 16 || new Set(ids).size !== 16) return "agi_certification_catalog_mismatch";
  return null;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "AGI_CERTIFICATION_STEP_FAILED";
}

function isTransientCertificationError(error: unknown): boolean {
  const message = errorMessage(error);
  return /\b429\b|rate[- ]?limit|free tier requests|quota|temporar|overload|5\d\d|already_running/i.test(message);
}

async function safeSnapshot(): Promise<AgiCertificationSnapshot> {
  return getAgiCertificationSnapshot("hocker-one");
}

async function runAgiCertificationStepInternal(args: RunArgs): Promise<AgiCertificationStepResult> {
  const before = await safeSnapshot();
  const guardError = snapshotGuardError(before);
  if (guardError) {
    return {
      ok: false,
      complete: false,
      halted: true,
      retryable: before.source === "partial",
      continue_after_ms: before.source === "partial" ? TRANSIENT_RETRY_DELAY_MS : 0,
      progress: progress(before),
      step: { kind: "blocked", agi_id: null, tool_key: null, passed: null },
      error: guardError,
    };
  }

  if (before.certified === 16 && before.pending === 0) {
    return {
      ok: true,
      complete: true,
      halted: false,
      retryable: false,
      continue_after_ms: 0,
      progress: progress(before),
      step: { kind: "complete", agi_id: null, tool_key: null, passed: true },
    };
  }

  const agiId = before.runtime_eval_targets[0];
  if (agiId) {
    try {
      const result = await runAgiEvalSuite({
        agi_id: agiId,
        actor_user_id: args.actor_user_id,
        oidc_token: args.oidc_token,
      });
      const after = await safeSnapshot();
      if (!result.passed) {
        return {
          ok: false,
          complete: false,
          halted: true,
          retryable: false,
          continue_after_ms: 0,
          progress: progress(after),
          step: { kind: "runtime_eval", agi_id: agiId, tool_key: null, passed: false },
          error: "runtime_eval_requires_remediation",
        };
      }
      const complete = after.certified === 16 && after.pending === 0;
      return {
        ok: true,
        complete,
        halted: false,
        retryable: false,
        continue_after_ms: complete ? 0 : RUNTIME_STEP_DELAY_MS,
        progress: progress(after),
        step: { kind: "runtime_eval", agi_id: agiId, tool_key: null, passed: true },
      };
    } catch (error) {
      const after = await safeSnapshot();
      const retryable = isTransientCertificationError(error);
      return {
        ok: false,
        complete: false,
        halted: true,
        retryable,
        continue_after_ms: retryable ? TRANSIENT_RETRY_DELAY_MS : 0,
        progress: progress(after),
        step: { kind: "runtime_eval", agi_id: agiId, tool_key: null, passed: false },
        error: retryable ? "runtime_eval_transient_failure" : "runtime_eval_failed",
      };
    }
  }

  const toolTarget = before.tool_eval_targets[0];
  if (toolTarget) {
    try {
      await runAgiReadOnlyToolProbe({
        agi_id: toolTarget.agi_id,
        tool_key: toolTarget.tool_key,
        actor_user_id: args.actor_user_id,
      });
      const after = await safeSnapshot();
      const complete = after.certified === 16 && after.pending === 0;
      return {
        ok: true,
        complete,
        halted: false,
        retryable: false,
        continue_after_ms: complete ? 0 : TOOL_STEP_DELAY_MS,
        progress: progress(after),
        step: {
          kind: "tool_eval",
          agi_id: toolTarget.agi_id,
          tool_key: toolTarget.tool_key,
          passed: true,
        },
      };
    } catch (error) {
      const after = await safeSnapshot();
      const retryable = isTransientCertificationError(error);
      return {
        ok: false,
        complete: false,
        halted: true,
        retryable,
        continue_after_ms: retryable ? TRANSIENT_RETRY_DELAY_MS : 0,
        progress: progress(after),
        step: {
          kind: "tool_eval",
          agi_id: toolTarget.agi_id,
          tool_key: toolTarget.tool_key,
          passed: false,
        },
        error: retryable ? "tool_eval_transient_failure" : "tool_eval_failed",
      };
    }
  }

  return {
    ok: false,
    complete: false,
    halted: true,
    retryable: false,
    continue_after_ms: 0,
    progress: progress(before),
    step: { kind: "blocked", agi_id: null, tool_key: null, passed: null },
    error: "certification_non_eval_evidence_pending",
  };
}

export async function runAgiCertificationStep(args: RunArgs): Promise<AgiCertificationStepResult> {
  if (activeCertificationStep) return activeCertificationStep;
  const current = runAgiCertificationStepInternal(args);
  activeCertificationStep = current;
  try {
    return await current;
  } finally {
    if (activeCertificationStep === current) activeCertificationStep = null;
  }
}
