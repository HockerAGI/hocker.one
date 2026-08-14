import { HOCKER_AGI_CANON } from "@/lib/hocker-agi-canon";
import { createAdminSupabase } from "@/lib/supabase-admin";

export const AGI_CERTIFICATION_VERSION = "2026.08.14-2";

type AgentRow = {
  agi_id: string;
  name: string | null;
  status: string | null;
  autonomy_level: string | null;
  allow_actions: boolean | null;
};
type ToolRow = { agi_id: string; enabled: boolean | null };
type MemoryRow = { agi_id: string | null; target_agi_ids: string[] | null; active: boolean | null };
type OperationalRow = { agi_id: string; tasks: number | null; runs: number | null };

export type AgiCertificationCheck =
  | "canonical_profile"
  | "tools_ready"
  | "memory_ready"
  | "runtime_evidence"
  | "allow_actions_guarded"
  | "individual_eval_suite";

export type AgiCertificationEntry = {
  agi_id: string;
  name: string;
  status: string;
  autonomy: string;
  evidence_percent: number;
  passed: number;
  total: number;
  certified_for_current_scope: boolean;
  checks: Record<AgiCertificationCheck, boolean>;
  missing: AgiCertificationCheck[];
};

export type AgiCertificationSnapshot = {
  version: string;
  checked_at: string;
  source: "supabase+code" | "partial";
  certified: number;
  pending: number;
  entries: AgiCertificationEntry[];
};

// Individual behavioural suites do not exist yet. Keeping this explicit prevents
// a global canon regression test from being mistaken for per-AGI certification.
const INDIVIDUAL_EVAL_SUITES: Record<string, boolean> = {
  nova: false,
  syntia: false,
  vertx: false,
  jurix: false,
  curvewind: false,
  numia: false,
  nova_ads: false,
  candy: false,
  pro_ia: false,
  hostia: false,
  trackhok: false,
  nexpa: false,
  chido_wins: false,
  chido_gerente: false,
  shadows: false,
  revia: false,
};

function canonicalId(value: string): string {
  return value.trim().toLowerCase().replaceAll("-", "_");
}

function countByAgi(rows: ToolRow[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (!row.enabled) continue;
    const id = canonicalId(row.agi_id);
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

export async function getAgiCertificationSnapshot(projectId = "hocker-one"): Promise<AgiCertificationSnapshot> {
  const checkedAt = new Date().toISOString();

  try {
    const sb = createAdminSupabase();
    const [agentsRes, toolsRes, memoryRes, operationsRes] = await Promise.all([
      sb.from("agi_agents").select("agi_id,name,status,autonomy_level,allow_actions").eq("project_id", projectId),
      sb.from("agi_agent_tools").select("agi_id,enabled").eq("project_id", projectId),
      sb.from("agi_memory_mirror").select("agi_id,target_agi_ids,active").eq("project_id", projectId).eq("active", true),
      sb.from("v_agi_operational_state").select("agi_id,tasks,runs"),
    ]);

    const queryFailed = [agentsRes, toolsRes, memoryRes, operationsRes].some((result) => result.error);
    const agents = (agentsRes.data ?? []) as AgentRow[];
    const toolCounts = countByAgi((toolsRes.data ?? []) as ToolRow[]);
    const memories = (memoryRes.data ?? []) as MemoryRow[];
    const operations = new Map(
      ((operationsRes.data ?? []) as OperationalRow[]).map((row) => [canonicalId(row.agi_id), row]),
    );
    const agentsById = new Map(agents.map((row) => [canonicalId(row.agi_id), row]));

    const entries: AgiCertificationEntry[] = HOCKER_AGI_CANON.map((profile) => {
      const id = canonicalId(profile.id);
      const agent = agentsById.get(id);
      const operational = operations.get(id);
      const memoryReady = memories.some((row) => {
        const direct = row.agi_id ? canonicalId(row.agi_id) === id : false;
        const targeted = (row.target_agi_ids ?? []).some((target) => canonicalId(target) === id);
        return Boolean(row.active && (direct || targeted));
      });
      const isShadows = id === "shadows";

      const checks: Record<AgiCertificationCheck, boolean> = {
        canonical_profile: Boolean(agent),
        tools_ready: isShadows ? toolCounts.get(id) === undefined : (toolCounts.get(id) ?? 0) > 0,
        memory_ready: memoryReady,
        runtime_evidence: (Number(operational?.tasks ?? 0) > 0) && (Number(operational?.runs ?? 0) > 0),
        allow_actions_guarded: agent?.allow_actions === false,
        individual_eval_suite: INDIVIDUAL_EVAL_SUITES[id] === true,
      };

      const missing = (Object.entries(checks) as Array<[AgiCertificationCheck, boolean]>)
        .filter(([, passed]) => !passed)
        .map(([key]) => key);
      const passed = Object.values(checks).filter(Boolean).length;
      const total = Object.keys(checks).length;

      return {
        agi_id: id,
        name: agent?.name ?? profile.name,
        status: agent?.status ?? "missing",
        autonomy: agent?.autonomy_level ?? "unknown",
        evidence_percent: Math.round((passed / total) * 100),
        passed,
        total,
        certified_for_current_scope: !queryFailed && missing.length === 0,
        checks,
        missing,
      };
    });

    return {
      version: AGI_CERTIFICATION_VERSION,
      checked_at: checkedAt,
      source: queryFailed ? "partial" : "supabase+code",
      certified: entries.filter((entry) => entry.certified_for_current_scope).length,
      pending: entries.filter((entry) => !entry.certified_for_current_scope).length,
      entries,
    };
  } catch {
    const entries: AgiCertificationEntry[] = HOCKER_AGI_CANON.map((profile) => ({
      agi_id: canonicalId(profile.id),
      name: profile.name,
      status: "unknown",
      autonomy: "unknown",
      evidence_percent: 0,
      passed: 0,
      total: 6,
      certified_for_current_scope: false,
      checks: {
        canonical_profile: false,
        tools_ready: false,
        memory_ready: false,
        runtime_evidence: false,
        allow_actions_guarded: false,
        individual_eval_suite: false,
      },
      missing: [
        "canonical_profile",
        "tools_ready",
        "memory_ready",
        "runtime_evidence",
        "allow_actions_guarded",
        "individual_eval_suite",
      ],
    }));

    return {
      version: AGI_CERTIFICATION_VERSION,
      checked_at: checkedAt,
      source: "partial",
      certified: 0,
      pending: entries.length,
      entries,
    };
  }
}
