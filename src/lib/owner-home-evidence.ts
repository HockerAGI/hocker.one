import "server-only";
import { requirePrivateSession } from "@/lib/require-private-session";
import { createServerSupabase } from "@/lib/supabase-server";
import { createAdminSupabase } from "@/lib/supabase-admin";

export type HomeEvidence = {
  checkedAt: string;
  environment: "production" | "preview" | "development" | "unknown";
  ownerMfa: boolean | null;
  ownerRole: boolean;
  protectedReads: boolean;
  nodeCount: number | null;
  agent: { name: string; lastSeen: string | null } | null;
  events: { id: string; type: string | null; created_at: string | null }[] | null;
  pendingCount: number | null;
  agiCount: number | null;
  memory: { active: number | null; updates: number | null; patterns: number | null; learning: number | null };
};

export async function getOwnerHomeEvidence(projectId: string): Promise<HomeEvidence> {
  const user = await requirePrivateSession(projectId);
  const sb = await createServerSupabase();
  const env = process.env.VERCEL_ENV;
  const environment = env === "production" || env === "preview" || env === "development" ? env : "unknown";
  const nodeId = process.env.HOCKER_PHYSICAL_AGENT_NODE_ID || process.env.HOCKER_LOCAL_AGENT_NODE_ID || "hocker-node-1";
  const [membership, assurance, nodes, node, events] = await Promise.allSettled([
    sb.from("project_members").select("role").eq("project_id", projectId).eq("user_id", user.id).maybeSingle(),
    sb.auth.mfa.getAuthenticatorAssuranceLevel(),
    sb.from("nodes").select("id", { count: "exact", head: true }).eq("project_id", projectId),
    sb.from("nodes").select("id,name,last_seen_at").eq("project_id", projectId).eq("id", nodeId).maybeSingle(),
    sb.from("events").select("id,type,created_at").eq("project_id", projectId).order("created_at", { ascending: false }).limit(5),
  ]);
  const ownerRole = membership.status === "fulfilled" && !membership.value.error && membership.value.data?.role === "owner";
  const ownerMfa = assurance.status === "fulfilled" && !assurance.value.error
    ? assurance.value.data.currentLevel === "aal2" : null;
  const protectedReads = environment === "production" && ownerRole && ownerMfa === true;
  const result: HomeEvidence = {
    checkedAt: new Date().toISOString(), environment, ownerRole, ownerMfa, protectedReads,
    nodeCount: nodes.status === "fulfilled" && !nodes.value.error && typeof nodes.value.count === "number" ? nodes.value.count : null,
    agent: node.status === "fulfilled" && !node.value.error && node.value.data
      ? { name: String(node.value.data.name || node.value.data.id), lastSeen: node.value.data.last_seen_at ?? null } : null,
    events: events.status === "fulfilled" && !events.value.error && Array.isArray(events.value.data) ? events.value.data : null,
    pendingCount: null, agiCount: null,
    memory: { active: null, updates: null, patterns: null, learning: null },
  };
  // Never use service-role data on a preview or for a session without Owner AAL2.
  if (protectedReads) {
    try {
      const admin = createAdminSupabase();
      const count = async (table: string, filter?: [string, string | boolean]) => {
        try {
          let query = admin.from(table).select("id", { count: "exact", head: true }).eq("project_id", projectId);
          if (filter) query = query.eq(filter[0], filter[1]);
          const { count, error } = await query;
          return !error && typeof count === "number" ? count : null;
        } catch { return null; }
      };
      const [pending, agis, active, updates, patterns, learning] = await Promise.all([
        count("agi_action_queue", ["status","needs_approval"]),
        count("agi_agents"),
        count("agi_memory_mirror", ["active",true]),
        count("agi_update_feed", ["status","active"]),
        count("agi_error_patterns"),
        count("agi_learning_events", ["status","approved"]),
      ]);
      result.pendingCount = pending;
      result.agiCount = agis;
      result.memory = { active, updates, patterns, learning };
    } catch { /* Individual protected metrics remain unknown. */ }
  }
  return result;
}
