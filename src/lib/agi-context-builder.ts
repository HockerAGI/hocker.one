import { buildCanonicalProfilePrompt, requireCanonicalAgi } from "@/lib/hocker-agi-operational";
import { loadAgiConversationContext } from "@/lib/agi-session-store";
import { createAdminSupabase } from "@/lib/supabase-admin";

type JsonRecord = Record<string, unknown>;
type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

type MemoryRow = {
  id: string;
  title: string;
  summary: string;
  target_agi_ids: string[];
  client_id: string | null;
  memory_payload: JsonRecord;
  confidence_score: number;
  freshness_score: number;
  source_hash: string | null;
  canonical_memory_key: string | null;
  valid_from: string;
  expires_at: string | null;
};

function cleanText(value: unknown, max = 6000): string {
  const text = String(value ?? "").replace(/\u0000/g, "").trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function jsonText(value: unknown, max = 6000): string {
  try {
    return cleanText(JSON.stringify(value ?? {}, null, 2), max);
  } catch {
    return "{}";
  }
}

function withinBudget(value: string, remaining: number): { text: string; used: number } {
  if (remaining <= 0) return { text: "", used: 0 };
  const text = value.length <= remaining ? value : `${value.slice(0, Math.max(0, remaining - 1))}…`;
  return { text, used: text.length };
}

async function loadMemoryItems(input: {
  project_id: string;
  agi_id: string;
  client_id?: string | null;
}): Promise<MemoryRow[]> {
  const now = new Date().toISOString();
  const { data, error } = await createAdminSupabase()
    .from("agi_memory_mirror")
    .select("id,title,summary,target_agi_ids,client_id,memory_payload,confidence_score,freshness_score,source_hash,canonical_memory_key,valid_from,expires_at")
    .eq("project_id", input.project_id)
    .eq("active", true)
    .eq("safety_status", "safe")
    .contains("target_agi_ids", [input.agi_id])
    .lte("valid_from", now)
    .order("freshness_score", { ascending: false })
    .order("confidence_score", { ascending: false })
    .limit(20);

  if (error) throw new Error(`AGI_MEMORY_READ_FAILED: ${error.message}`);
  return ((data ?? []) as MemoryRow[]).filter((row) => {
    if (row.expires_at && row.expires_at <= now) return false;
    if (!row.client_id) return true;
    return Boolean(input.client_id) && row.client_id === input.client_id;
  });
}

export async function buildAgiInferenceContext(input: {
  agi_id: string;
  project_id: string;
  session_id: string;
  user_id?: string | null;
  client_id?: string | null;
  app_id?: string | null;
  operational_context?: JsonRecord;
  context_budget?: number;
}): Promise<{ system: string; messages: ChatMessage[]; evidence_refs: string[] }> {
  const canon = requireCanonicalAgi(input.agi_id);
  const conversation = await loadAgiConversationContext({
    session_id: input.session_id,
    project_id: input.project_id,
    agi_id: canon.id,
    user_id: input.user_id ?? null,
    limit: 30,
  });
  const memories = await loadMemoryItems({
    project_id: input.project_id,
    agi_id: canon.id,
    client_id: input.client_id ?? null,
  });

  const context_budget = Math.max(8000, Math.min(input.context_budget ?? 32000, 80000));
  const messageBudget = Math.max(4000, Math.min(18_000, Math.floor(context_budget * 0.45)));
  let systemRemaining = Math.max(3000, context_budget - messageBudget);
  let messageRemaining = messageBudget;
  const evidence_refs: string[] = [];

  // Authority order is intentional and tested: canonical_profile -> recent_messages -> durable_summary -> memory_items.
  const canonical_profile = buildCanonicalProfilePrompt(canon);
  const recent_messages = conversation.recent_messages;
  const durable_summary = cleanText(conversation.summary, 10000);
  const memory_items = memories;

  const systemParts: string[] = [];
  const canonPart = withinBudget(canonical_profile, systemRemaining);
  systemParts.push(canonPart.text);
  systemRemaining -= canonPart.used;

  if (durable_summary && systemRemaining > 0) {
    const part = withinBudget(
      `Resumen durable de la sesión:\n${durable_summary}`,
      Math.min(systemRemaining, 8000),
    );
    if (part.text) systemParts.push(part.text);
    systemRemaining -= part.used;
  }

  if (memory_items.length && systemRemaining > 0) {
    const formatted = memory_items
      .map((item) => {
        evidence_refs.push(`memory:${item.id}`);
        if (item.source_hash) evidence_refs.push(`memory-source:${item.source_hash}`);
        return `- ${cleanText(item.title, 260)}: ${cleanText(item.summary, 1200)}`;
      })
      .join("\n");
    const part = withinBudget(
      `Memory Mirror aprobado y aplicable:\n${formatted}`,
      Math.min(systemRemaining, 9000),
    );
    if (part.text) systemParts.push(part.text);
    systemRemaining -= part.used;
  }

  if (input.operational_context && Object.keys(input.operational_context).length && systemRemaining > 0) {
    const part = withinBudget(
      `Contexto operativo de la solicitud (no sustituye canon):\n${jsonText(input.operational_context, 7000)}`,
      Math.min(systemRemaining, 8000),
    );
    if (part.text) systemParts.push(part.text);
    systemRemaining -= part.used;
  }

  // Select newest messages first so the current/latest user turn survives any budget pressure,
  // then restore chronological order for inference.
  const selectedNewestFirst: ChatMessage[] = [];
  for (let index = recent_messages.length - 1; index >= 0; index -= 1) {
    if (messageRemaining <= 0) break;
    const message = recent_messages[index];
    if (!message) continue;
    if (message.role !== "user" && message.role !== "assistant") continue;
    const part = withinBudget(cleanText(message.content, 8000), messageRemaining);
    if (!part.text) continue;
    selectedNewestFirst.push({ role: message.role, content: part.text });
    evidence_refs.push(`message:${message.id}`);
    messageRemaining -= part.used;
  }
  const messages = selectedNewestFirst.reverse();

  evidence_refs.push(`session:${conversation.session_id}`, `thread:${conversation.thread_id}`);
  return {
    system: systemParts.filter(Boolean).join("\n\n"),
    messages,
    evidence_refs: [...new Set(evidence_refs)],
  };
}
