import { AGI_REGISTRY, APP_REGISTRY } from "@/lib/hocker-dashboard";
import { getHockerPublicPrivateTopologyContext } from "@/lib/hocker-public-private-topology";
import { getHockerProviderOrchestratorPublicContext } from "@/lib/hocker-provider-orchestrator";
import { getHockerDiagnosticsProviderRouterPublicContext } from "@/lib/hocker-diagnostics-provider-router";
import { getRuntimeToolSummary } from "@/lib/agi-runtime-core";
import { getHockerCapabilitiesContract } from "@/lib/hocker-capabilities-contract";
import { getSyntiaOperationalMemorySnapshot } from "@/lib/syntia-operational-memory";
import { getSyntiaMemoryWriteGatePublicContext } from "@/lib/syntia-memory-write-gate";
import { getSyntiaMemoryReviewGatePublicContext } from "@/lib/syntia-memory-review-gate";
import { getSyntiaMemoryPublicationAuditPublicContext } from "@/lib/syntia-memory-publication-audit";
import { getNovaChatActionDraftPublicContext } from "@/lib/nova-chat-action-drafts";
import { getNovaGitHubActionMaterializerPublicContext } from "@/lib/nova-github-action-materializer";
import { getHockerNovaAlwaysOnAwarenessContext } from "@/lib/hocker-nova-always-on-awareness";

const CONTEXT_BRIDGE_DOC = "docs/operations/CONTEXT_BRIDGE_V1.md";
const PLATFORM_CLOSURE_GATE = "docs/operations/PLATFORM_CLOSURE_GATE_2026-08-14.md";

export function getHockerContinuityContextPack(projectId = process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one") {
  const tools = getRuntimeToolSummary();
  const capabilities = getHockerCapabilitiesContract(projectId);

  return {
    ok: true,
    generated_at: new Date().toISOString(),
    context_contract: {
      mode: "evidence_driven",
      context_bridge_doc: CONTEXT_BRIDGE_DOC,
      closure_gate: PLATFORM_CLOSURE_GATE,
      rule: "El Context Pack no define fases ni porcentajes manuales. Estado, salud y avance se derivan de registries, Context Bridge, Supabase, deployments, tests y evidence packs vigentes.",
    },
    project: {
      id: projectId,
      name: "Hocker ONE",
      purpose: "Control plane privado del ecosistema HOCKER para coordinar NOVA, AGIs, capacidades reales, Owner Gate, auditoría y ejecución controlada.",
    },
    public_private_topology: getHockerPublicPrivateTopologyContext(),
    provider_orchestrator_inventory: getHockerProviderOrchestratorPublicContext(),
    diagnostics_provider_router: getHockerDiagnosticsProviderRouterPublicContext(),
    nova_always_on_awareness: getHockerNovaAlwaysOnAwarenessContext(),
    non_negotiable_rules: [
      "Nada de escritura directa a main.",
      "Nada de ejecución material sin el gate de autorización correspondiente.",
      "Toda acción sensible debe pasar por Owner Gate / agi_action_queue.",
      "Toda ejecución debe guardar execution_result o execution_error y evidencia trazable.",
      "No inventar integraciones: configuración no equivale a conexión y ausencia de evidencia equivale a pendiente/no verificado.",
      "No inventar porcentajes: sólo reportar avance cuando existe un denominador explícito de gates observables.",
      "No copiar secretos, tokens, cookies, TOTP, KYC, PII restringida ni conversaciones privadas a Context Bridge o Memory Mirror.",
    ],
    progress_reporting: {
      mode: "observable_gates_only",
      aggregate_percentages_in_context_pack: false,
      rule: "Los porcentajes pertenecen a contratos que puedan demostrar passed/total. Para AGIs usar la matriz de certificación; para Apps e integraciones usar sus gates verificables y estado vivo. No reutilizar estimaciones históricas.",
      canonical_counts: {
        apps: APP_REGISTRY.length,
        agis: AGI_REGISTRY.length,
      },
    },
    implemented_runtime: {
      github_read: ["get_repo", "list_tree", "read_file", "compare_refs", "audit_paths"],
      github_write_gate: ["create_branch", "upsert_file", "create_pr"],
      github_approved_worker: ["create_branch", "upsert_file", "create_pr"],
      github_guided_execution_chain: ["approve_next_step", "execute_authorized_step", "show_result_or_error"],
      queue_table: "public.agi_action_queue",
      owner_gate: true,
      audit_chain: true,
    },
    apps: APP_REGISTRY.map((app) => ({
      key: app.key,
      title: app.title,
      status: app.status,
      category: app.group,
    })),
    agis: AGI_REGISTRY.map((agi) => ({
      key: agi.key,
      title: agi.title,
      status: agi.status,
      category: agi.group,
    })),
    integrations: tools.tools.map((tool) => ({
      tool_key: tool.tool_key,
      name: tool.name,
      provider: tool.provider,
      status: tool.status,
      status_label: tool.status_label,
      execution_enabled: tool.execution_enabled,
      supports_read: tool.supports_read,
      supports_write: tool.supports_write,
      next_step: tool.next_step,
    })),
    capabilities_contract: capabilities.public_context,
    syntia_operational_memory: {
      status: "available_via_async_context",
      endpoint: "/api/agi/runtime/memory",
      rule: "Solo lectura desde el Context Pack. La publicación de memoria reutilizable conserva sus gates de revisión.",
    },
    handoff_prompt_for_nova: "Antes de responder o preparar acciones, usa el contexto operativo más reciente, revisa agi_action_queue, respeta Queue Lock, consulta capabilities_contract y usa memoria SYNTIA sólo dentro de su alcance autorizado. NOVA no debe fingir integraciones, salud, certificaciones ni avance. Toda acción sensible requiere Owner Gate, pruebas, auditoría y reversa/compensación cuando aplique.",
  };
}

export async function getHockerContinuityContextPackWithMemory(projectId = process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one") {
  const base = getHockerContinuityContextPack(projectId);
  const memory = await getSyntiaOperationalMemorySnapshot(projectId);

  return {
    ...base,
    project: {
      ...base.project,
      id: projectId,
    },
    syntia_operational_memory: memory.public_context,
    memory_write_gate: getSyntiaMemoryWriteGatePublicContext(),
    memory_review_gate: getSyntiaMemoryReviewGatePublicContext(),
    memory_publication_audit: getSyntiaMemoryPublicationAuditPublicContext(),
    nova_chat_action_drafts: getNovaChatActionDraftPublicContext(),
    nova_github_action_materializer: getNovaGitHubActionMaterializerPublicContext(),
    nova_chat_guided_execution: {
      status: "active_contract",
      mode: "chat_owner_buttons_guided_github_chain_with_clean_ux",
      rules: {
        button_visibility_only_when_needed: true,
        approve_next_step_only: true,
        execute_authorized_step_only: true,
        github_order_enforced: ["github.create_branch", "github.upsert_file", "github.create_pr"],
        no_direct_execution_from_chat: true,
        owner_gate_required: true,
        no_main_direct_write: true,
        human_labels_enabled: true,
        technical_ids_hidden_by_default: true,
        evidence_and_rollback_visible_on_demand: true,
      },
    },
  };
}
