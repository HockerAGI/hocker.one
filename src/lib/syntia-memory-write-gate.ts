import {
  ACTION_SCOPES,
  HOCKER_MEMORY_MIRROR_API_VERSION,
  RETENTION_TIERS,
  RISK_LEVELS,
  SOURCE_TYPES,
  UPDATE_TYPES,
  agiArray,
  agiName,
  auditEvent,
  bool,
  canonicalKey,
  hash,
  intRange,
  jsonObject,
  optText,
  pick,
  sb,
  stringArray,
  text,
  type JsonObject,
} from "@/lib/hocker-memory-mirror";

export const SYNTIA_MEMORY_WRITE_GATE_VERSION = "12.7G-1";

type MemoryGateInput = Record<string, unknown>;

type SensitiveSignal = {
  key: string;
  severity: "warn" | "block";
};

const SENSITIVE_PATTERNS: Array<{ key: string; severity: "warn" | "block"; pattern: RegExp }> = [
  {
    key: "api_key_or_token",
    severity: "block",
    pattern: /\b(sk-[A-Za-z0-9_-]{10,}|ghp_[A-Za-z0-9_]{10,}|github_pat_[A-Za-z0-9_]{20,}|AIza[0-9A-Za-z_-]{20,}|AKIA[0-9A-Z]{16})\b/g,
  },
  {
    key: "secret_assignment",
    severity: "block",
    pattern: /\b(password|passwd|secret|token|api[_-]?key|private[_-]?key)\b\s*[:=]\s*["']?[^"'\s]{8,}/gi,
  },
  {
    key: "email_or_contact",
    severity: "block",
    pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
  },
  {
    key: "card_like_number",
    severity: "block",
    pattern: /\b(?:\d[ -]*?){13,19}\b/g,
  },
  {
    key: "long_numeric_identifier",
    severity: "warn",
    pattern: /\b\d{10,}\b/g,
  },
];

function compact(value: unknown, max = 420): string {
  const clean = String(value ?? "").replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

function sensitiveScan(parts: unknown[]): SensitiveSignal[] {
  const blob = parts.map((part) => {
    if (typeof part === "string") return part;
    try {
      return JSON.stringify(part ?? {});
    } catch {
      return "";
    }
  }).join("\n");

  const found = new Map<string, SensitiveSignal>();

  for (const rule of SENSITIVE_PATTERNS) {
    rule.pattern.lastIndex = 0;
    if (rule.pattern.test(blob)) {
      found.set(rule.key, { key: rule.key, severity: rule.severity });
    }
  }

  return [...found.values()];
}

function buildDraft(input: MemoryGateInput) {
  const projectId = text(input.project_id, "hocker-one", 80);
  const sourceAgiId = agiArray(input.source_agi_id || input.agi_id, ["syntia"])[0] || "syntia";
  const title = text(input.learning_title || input.title, "", 220);
  const summary = text(input.learning_summary || input.summary || input.message, "", 3000);
  const updateType = pick(input.update_type, UPDATE_TYPES, "agi_observation");
  const sourceType = pick(input.source_type, SOURCE_TYPES, "owner_note");
  const riskLevel = pick(input.risk_level, RISK_LEVELS, "medium");
  const retentionTier = pick(input.retention_tier, RETENTION_TIERS, "hot");
  const actionScope = pick(input.action_scope, ACTION_SCOPES, "recommendation");
  const appliesToAgiIds = agiArray(input.applies_to_agi_ids || input.suggested_targets, [sourceAgiId]);
  const suggestedTargets = agiArray(input.suggested_targets, appliesToAgiIds);
  const sourcePlatform = optText(input.source_platform, 80);
  const clientId = optText(input.client_id, 120);
  const sourceHash =
    optText(input.source_hash, 128) ||
    hash([
      projectId,
      sourceAgiId,
      updateType,
      sourceType,
      sourcePlatform,
      input.source_url,
      title,
      summary,
      clientId,
      input.brand_id,
      input.campaign_id,
      input.content_id,
    ]);

  const semanticHash =
    optText(input.semantic_hash, 128) ||
    hash([title, summary, updateType, appliesToAgiIds]);

  const canonicalMemoryKey =
    optText(input.canonical_memory_key, 240) ||
    canonicalKey({
      agi: sourceAgiId,
      type: updateType,
      platform: sourcePlatform,
      client: clientId,
      title,
    });

  return {
    project_id: projectId,
    source_agi_id: sourceAgiId,
    source_agi_name: agiName(sourceAgiId),
    title,
    summary,
    learning_category: text(input.learning_category, "general", 120),
    evidence: jsonObject(input.evidence),
    suggested_targets: suggestedTargets,
    applies_to_agi_ids: appliesToAgiIds,
    applies_to_modules: stringArray(input.applies_to_modules),
    risk_level: riskLevel,
    update_type: updateType,
    source_type: sourceType,
    source_name: optText(input.source_name, 180),
    source_url: optText(input.source_url, 500),
    source_platform: sourcePlatform,
    source_hash: sourceHash,
    semantic_hash: semanticHash,
    canonical_memory_key: canonicalMemoryKey,
    client_id: clientId,
    brand_id: optText(input.brand_id, 120),
    campaign_id: optText(input.campaign_id, 160),
    content_id: optText(input.content_id, 160),
    profile_id: optText(input.profile_id, 160),
    confidence_score: intRange(input.confidence_score, 3, 1, 5),
    freshness_score: intRange(input.freshness_score, 3, 1, 5),
    valid_from: optText(input.valid_from, 80) || new Date().toISOString(),
    expires_at: optText(input.expires_at, 80),
    prevents_error: bool(input.prevents_error, false),
    error_pattern: optText(input.error_pattern, 1000),
    recommended_action: optText(input.recommended_action, 1500),
    action_scope: actionScope,
    requires_owner_approval: true,
    official_source: bool(input.official_source, sourceType === "official_source"),
    retention_tier: retentionTier,
    submitted_by: text(input.submitted_by, "syntia-memory-write-gate", 160),
  };
}

export function getSyntiaMemoryWriteGatePublicContext() {
  return {
    version: SYNTIA_MEMORY_WRITE_GATE_VERSION,
    memory_mirror_api_version: HOCKER_MEMORY_MIRROR_API_VERSION,
    status: "active",
    mode: "safe_proposals_only",
    source: "hocker-one",
    rules: {
      preflight_is_read_only: true,
      submit_creates_pending_review_only: true,
      no_direct_memory_publish: true,
      no_update_feed_publish: true,
      no_error_pattern_upsert: true,
      no_actions_created: true,
      owner_gate_required: true,
      sensitive_data_blocked: true,
    },
    tables_used: {
      proposals: "public.agi_learning_events",
      reviews_existing: "public.agi_learning_reviews",
      published_memory_existing: "public.agi_memory_mirror",
      update_feed_existing: "public.agi_update_feed",
    },
    next_step:
      "12.7H ya endurece la decisión/publicación owner (actor validado en servidor; reviewer_role del body ignorado). Pendiente del dueño: aplicar la migración de índices únicos para idempotencia real de submit/review.",
  };
}

export async function buildSyntiaMemoryProposalPreflight(input: MemoryGateInput) {
  const draft = buildDraft(input);
  const missing: string[] = [];

  if (!draft.source_agi_id) missing.push("source_agi_id");
  if (!draft.title) missing.push("learning_title");
  if (!draft.summary) missing.push("learning_summary");

  const sensitiveSignals = sensitiveScan([
    draft.title,
    draft.summary,
    draft.evidence,
    draft.error_pattern,
    draft.recommended_action,
    input.sensitive_data_note,
  ]);

  const blockingSensitiveSignals = sensitiveSignals.filter((signal) => signal.severity === "block");

  const db = sb();

  const { data: existingLearning, error: learningError } = await db
    .from("agi_learning_events")
    .select("id,status,source_hash,canonical_memory_key,created_at")
    .eq("project_id", draft.project_id)
    .or(`source_hash.eq.${draft.source_hash},canonical_memory_key.eq.${draft.canonical_memory_key}`)
    .limit(10);

  const { data: existingMemory, error: memoryError } = await db
    .from("agi_memory_mirror")
    .select("id,active,source_hash,canonical_memory_key,created_at")
    .eq("project_id", draft.project_id)
    .or(`source_hash.eq.${draft.source_hash},canonical_memory_key.eq.${draft.canonical_memory_key}`)
    .limit(10);

  const hasBlockingDuplicate =
    Boolean(existingLearning?.some((row) => ["pending_review", "approved"].includes(String(row.status || "")))) ||
    Boolean(existingMemory?.some((row) => Boolean(row.active)));

  const canSubmit =
    missing.length === 0 &&
    blockingSensitiveSignals.length === 0 &&
    !learningError &&
    !memoryError &&
    !hasBlockingDuplicate;

  return {
    ok: true,
    version: SYNTIA_MEMORY_WRITE_GATE_VERSION,
    dry_run: true,
    writes_planned: false,
    can_submit: canSubmit,
    project_id: draft.project_id,
    decision: {
      status: canSubmit ? "ready_for_pending_proposal" : "blocked_or_needs_review",
      missing,
      sensitive_signals: sensitiveSignals,
      duplicate_block: hasBlockingDuplicate,
      db_errors: [learningError?.message, memoryError?.message].filter(Boolean),
    },
    proposal_preview: {
      source_agi_id: draft.source_agi_id,
      source_agi_name: draft.source_agi_name,
      title: draft.title,
      summary_preview: compact(draft.summary),
      applies_to_agi_ids: draft.applies_to_agi_ids,
      risk_level: draft.risk_level,
      update_type: draft.update_type,
      source_type: draft.source_type,
      retention_tier: draft.retention_tier,
      source_hash: draft.source_hash,
      semantic_hash: draft.semantic_hash,
      canonical_memory_key: draft.canonical_memory_key,
      requires_owner_approval: true,
    },
    existing: {
      learning_events: existingLearning || [],
      memory_mirror: existingMemory || [],
    },
    public_context: getSyntiaMemoryWriteGatePublicContext(),
  };
}

export async function submitSyntiaMemoryProposal(input: MemoryGateInput, traceId: string) {
  const preflight = await buildSyntiaMemoryProposalPreflight(input);

  if (!preflight.can_submit) {
    await auditEvent({
      projectId: preflight.project_id,
      level: "warn",
      type: "memory_write_gate.proposal_blocked",
      message: "Propuesta de memoria bloqueada por Write Gate.",
      data: {
        trace_id: traceId,
        version: SYNTIA_MEMORY_WRITE_GATE_VERSION,
        decision: preflight.decision as unknown as JsonObject,
        proposal_preview: preflight.proposal_preview as unknown as JsonObject,
      },
    });

    return {
      ok: false,
      trace_id: traceId,
      executed: false,
      reason: "memory_proposal_not_safe_to_submit",
      ...preflight,
    };
  }

  const draft = buildDraft(input);
  const db = sb();

  const { data, error } = await db
    .from("agi_learning_events")
    .insert({
      project_id: draft.project_id,
      source_agi_id: draft.source_agi_id,
      source_agi_name: draft.source_agi_name,
      source_module: "syntia-memory-write-gate",
      learning_title: draft.title,
      learning_summary: draft.summary,
      learning_category: draft.learning_category,
      evidence: draft.evidence,
      suggested_targets: draft.suggested_targets,
      applies_to_agi_ids: draft.applies_to_agi_ids,
      applies_to_modules: draft.applies_to_modules,
      risk_level: draft.risk_level,
      status: "pending_review",
      update_type: draft.update_type,
      source_type: draft.source_type,
      source_name: draft.source_name,
      source_url: draft.source_url,
      source_platform: draft.source_platform,
      source_hash: draft.source_hash,
      semantic_hash: draft.semantic_hash,
      canonical_memory_key: draft.canonical_memory_key,
      client_id: draft.client_id,
      brand_id: draft.brand_id,
      campaign_id: draft.campaign_id,
      content_id: draft.content_id,
      profile_id: draft.profile_id,
      confidence_score: draft.confidence_score,
      freshness_score: draft.freshness_score,
      valid_from: draft.valid_from,
      expires_at: draft.expires_at,
      prevents_error: draft.prevents_error,
      error_pattern: draft.error_pattern,
      recommended_action: draft.recommended_action,
      action_scope: draft.action_scope,
      requires_owner_approval: true,
      official_source: draft.official_source,
      retention_tier: draft.retention_tier,
      contains_sensitive_data: false,
      sensitive_data_note: null,
      submitted_by: draft.submitted_by,
    })
    .select("id,status,source_hash,canonical_memory_key")
    .single();

  if (error) {
    // Idempotencia real: si el índice único de propuestas vivas dispara una
    // colisión (envío concurrente con el mismo source_hash), no es un fallo.
    // Recuperamos la propuesta viva existente y registramos que se vio de nuevo.
    if ((error as { code?: string }).code === "23505") {
      const { data: existing } = await db
        .from("agi_learning_events")
        .select("id,status,source_hash,canonical_memory_key,times_seen")
        .eq("project_id", draft.project_id)
        .eq("source_hash", draft.source_hash)
        .in("status", ["pending_review", "approved"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existing?.id) {
        await db
          .from("agi_learning_events")
          .update({
            times_seen: Number(existing.times_seen || 1) + 1,
            last_seen_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        await auditEvent({
          projectId: draft.project_id,
          type: "memory_write_gate.proposal_deduplicated",
          message: "Propuesta de memoria deduplicada (idempotente) por Write Gate.",
          data: {
            trace_id: traceId,
            version: SYNTIA_MEMORY_WRITE_GATE_VERSION,
            learning_event_id: existing.id,
            source_hash: draft.source_hash,
            canonical_memory_key: draft.canonical_memory_key,
            deduplicated: true,
          },
        });

        return {
          ok: true,
          trace_id: traceId,
          executed: false,
          published: false,
          feed_created: false,
          actions_created: false,
          deduplicated: true,
          learning_event_id: existing.id,
          status: existing.status,
          source_hash: existing.source_hash,
          canonical_memory_key: existing.canonical_memory_key,
          message:
            "Ya existía una propuesta viva equivalente. Se registró la repetición sin duplicar.",
          version: SYNTIA_MEMORY_WRITE_GATE_VERSION,
          preflight,
        };
      }
    }

    return {
      ok: false,
      trace_id: traceId,
      executed: false,
      reason: "failed_to_submit_memory_proposal",
      error: error.message,
      preflight,
    };
  }

  await auditEvent({
    projectId: draft.project_id,
    type: "memory_write_gate.proposal_submitted",
    message: "Propuesta de memoria enviada a revisión mediante 12.7G Write Gate.",
    data: {
      trace_id: traceId,
      version: SYNTIA_MEMORY_WRITE_GATE_VERSION,
      learning_event_id: data?.id,
      source_agi_id: draft.source_agi_id,
      applies_to_agi_ids: draft.applies_to_agi_ids,
      canonical_memory_key: draft.canonical_memory_key,
      published: false,
      feed_created: false,
      actions_created: false,
    },
  });

  return {
    ok: true,
    trace_id: traceId,
    executed: false,
    published: false,
    feed_created: false,
    actions_created: false,
    learning_event_id: data?.id,
    status: data?.status,
    source_hash: data?.source_hash,
    canonical_memory_key: data?.canonical_memory_key,
    message: "Propuesta guardada como pending_review. No se publicó en Memory Mirror ni en update feed.",
    version: SYNTIA_MEMORY_WRITE_GATE_VERSION,
    preflight,
  };
}

export async function buildSyntiaCuratedMemoryHandoff(input: MemoryGateInput) {
  const projectId = text(input.project_id, "hocker-one", 80);
  const targetAgiId = agiArray(input.target_agi_id || input.agi_id)[0];
  const limitValue = intRange(input.limit, 12, 1, 30);

  let query = sb()
    .from("agi_memory_mirror")
    .select("id,title,summary,category,source_agi_id,target_agi_ids,risk_level:safety_status,source_type,canonical_memory_key,confidence_score,freshness_score,retention_tier,valid_from,expires_at,times_seen,last_seen_at,created_at")
    .eq("project_id", projectId)
    .eq("active", true)
    .eq("safety_status", "safe")
    .order("created_at", { ascending: false })
    .limit(limitValue);

  if (targetAgiId) {
    query = query.contains("target_agi_ids", [targetAgiId]);
  }

  const { data, error } = await query;

  return {
    ok: !error,
    version: SYNTIA_MEMORY_WRITE_GATE_VERSION,
    project_id: projectId,
    target_agi_id: targetAgiId || null,
    read_only: true,
    error: error?.message || null,
    handoff: (data || []).map((row) => ({
      id: row.id,
      title: row.title,
      summary: compact(row.summary, 520),
      category: row.category,
      source_agi_id: row.source_agi_id,
      target_agi_ids: row.target_agi_ids,
      source_type: row.source_type,
      canonical_memory_key: row.canonical_memory_key,
      confidence_score: row.confidence_score,
      freshness_score: row.freshness_score,
      retention_tier: row.retention_tier,
      created_at: row.created_at,
    })),
    public_context: getSyntiaMemoryWriteGatePublicContext(),
  };
}
