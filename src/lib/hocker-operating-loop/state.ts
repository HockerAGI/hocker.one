import { WorkSessionState } from "./types";

const TRANSITIONS: Record<WorkSessionState, readonly WorkSessionState[]> = {
  planning: ["researching", "blocked", "canceled"],
  researching: ["ready", "blocked", "failed", "canceled"],
  ready: ["awaiting_owner", "executing", "blocked", "canceled"],
  awaiting_owner: ["approved", "blocked", "canceled"],
  approved: ["executing", "blocked", "canceled"],
  executing: ["verifying", "failed", "blocked"],
  verifying: ["completed", "failed", "blocked"],
  completed: [],
  blocked: ["planning", "canceled"],
  failed: ["planning", "canceled"],
  canceled: [],
};

export function isValidWorkSessionTransition(from: WorkSessionState, to: WorkSessionState): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertValidWorkSessionTransition(from: WorkSessionState, to: WorkSessionState): void {
  if (!isValidWorkSessionTransition(from, to)) {
    throw new Error(`INVALID_WORK_SESSION_TRANSITION:${from}->${to}`);
  }
}
