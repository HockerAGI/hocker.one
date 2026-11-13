/**
 * Central deny-by-default eligibility for AGI reuse of Memory Mirror records.
 * A metadata row marked "active" is NOT by itself reviewed knowledge.
 * All four specialist validations and an approved provenance link are required,
 * except the 16 explicitly versioned HOCKER canonical AGI seed profiles.
 */
export type MirrorPolicyRow = {
  id: string;
  project_id: string;
  active: boolean;
  safety_status: string | null;
  approved_by_nova: boolean;
  approved_by_syntia: boolean;
  approved_by_vertx: boolean;
  approved_by_jurix: boolean;
  learning_event_id: string | null;
  source_hash: string | null;
  source_type: string | null;
  source_name: string | null;
  canonical_memory_key: string | null;
  valid_from: string | null;
  expires_at: string | null;
};

export type LearningPolicyRow = {
  id: string;
  project_id: string;
  status: string;
  source_hash: string | null;
};

function validDate(value: string | null, nowMs: number, isStart: boolean): boolean {
  if (value === null) return !isStart;
  const at = Date.parse(value);
  if (!Number.isFinite(at)) return false;
  return isStart ? at <= nowMs : at > nowMs;
}

export function isMemoryApprovedForAgi(
  row: MirrorPolicyRow,
  learning: ReadonlyMap<string, LearningPolicyRow>,
  projectId: string,
  nowMs: number,
): boolean {
  if (row.project_id !== projectId || !row.active || row.safety_status !== "safe") return false;
  if (!(row.approved_by_nova && row.approved_by_syntia &&
    row.approved_by_vertx && row.approved_by_jurix)) return false;
  if (!validDate(row.valid_from, nowMs, true) ||
      !validDate(row.expires_at, nowMs, false)) return false;
  if (!row.source_hash || !row.canonical_memory_key) return false;

  if (row.learning_event_id) {
    const source = learning.get(row.learning_event_id);
    return Boolean(source && source.project_id === projectId &&
      source.status === "approved" && source.source_hash === row.source_hash);
  }

  // Legacy immutable profiles were published by a known, audited migration,
  // not by a learning event. Do not extend this exception to owner notes.
  return row.source_type === "official_source" &&
    row.source_name === "HOCKER AGI Canon 12.6C.1B" &&
    /^canon\.profile\.[a-z0-9_]+\.12_6c_1b$/.test(row.canonical_memory_key);
}
