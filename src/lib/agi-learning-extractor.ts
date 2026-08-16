import { createHash } from "node:crypto";
import { submitSyntiaMemoryProposal } from "@/lib/syntia-memory-write-gate";
import { createAdminSupabase } from "@/lib/supabase-admin";

type LearningCandidate = {
  title: string;
  summary: string;
  confidence: number;
  source_refs: string[];
  category: string;
};

const SMALL_TALK = /^(hola|hello|hey|gracias|thanks|ok|okay|vale|perfecto|listo|buenas|buen día|buen dia)[.!\s]*$/i;
const SENSITIVE = /\b(password|passwd|secret|token|api[_-]?key|private[_-]?key|bearer|authorization)\b|\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b|\b(?:\d[ -]*?){13,19}\b/i;
const MATERIAL = /\b(decidimos|decisión|decision|regla|siempre|nunca|debe|no debe|arquitectura|canon|política|policy|migración|migration|error|bug|causa raíz|root cause|solución|fix|fallback|owner gate|seguridad|security|runtime|provider|memoria|contexto|continuidad)\b/i;

function compact(value: string, max: number): string {
  const clean = value.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function buildCandidate(input: {
  session_id: string;
  agi_id: string;
  user_message: string;
  assistant_message: string;
}): LearningCandidate | null {
  const user = compact(input.user_message, 1800);
  const assistant = compact(input.assistant_message, 2400);
  if (!user || !assistant) return null;
  if (SMALL_TALK.test(user) || (user.length < 20 && !MATERIAL.test(user))) return null;
  if (SENSITIVE.test(user) || SENSITIVE.test(assistant)) return null;
  if (!MATERIAL.test(user) && !MATERIAL.test(assistant)) return null;

  const summary = compact(
    `Contexto/decisión durable detectada. Solicitud: ${user}. Resultado acordado/verificado: ${assistant}`,
    2200,
  );
  return {
    title: compact(`Aprendizaje de sesión ${input.agi_id}: ${user}`, 180),
    summary,
    confidence: 3,
    source_refs: [`session:${input.session_id}`, `session-hash:${hash(`${user}\n${assistant}`)}`],
    category: /error|bug|causa raíz|root cause|solución|fix/i.test(`${user} ${assistant}`)
      ? "error_resolution"
      : /arquitectura|runtime|fallback|provider|memoria|contexto|continuidad/i.test(`${user} ${assistant}`)
        ? "architecture"
        : "decision",
  };
}

export async function extractLearningCandidate(input: {
  project_id: string;
  session_id: string;
  assistant_message_id?: string | null;
  agi_id: string;
  user_message: string;
  assistant_message: string;
  trace_id?: string | null;
}): Promise<LearningCandidate | null> {
  const candidate = buildCandidate(input);
  const learning_processed_at = new Date().toISOString();

  if (!candidate) {
    if (input.assistant_message_id) {
      await createAdminSupabase()
        .from("agi_messages")
        .update({ learning_processed_at })
        .eq("id", input.assistant_message_id)
        .is("learning_processed_at", null);
    }
    return null;
  }

  const traceId = input.trace_id || crypto.randomUUID();
  await submitSyntiaMemoryProposal(
    {
      project_id: input.project_id,
      source_agi_id: input.agi_id,
      learning_title: candidate.title,
      learning_summary: candidate.summary,
      learning_category: candidate.category,
      evidence: { source_refs: candidate.source_refs },
      suggested_targets: [input.agi_id],
      applies_to_agi_ids: [input.agi_id],
      confidence_score: candidate.confidence,
      freshness_score: 5,
      source_type: "agi_observation",
      source_name: "agi-session-learning-extractor",
      source_hash: hash(candidate.source_refs.join("|")),
      retention_tier: "hot",
      action_scope: "recommendation",
      requires_owner_approval: true,
      submitted_by: "agi-learning-extractor",
    },
    traceId,
  );

  if (input.assistant_message_id) {
    const { error } = await createAdminSupabase()
      .from("agi_messages")
      .update({ learning_processed_at })
      .eq("id", input.assistant_message_id)
      .is("learning_processed_at", null);
    if (error) throw new Error(`AGI_LEARNING_MARK_FAILED: ${error.message}`);
  }
  return candidate;
}
