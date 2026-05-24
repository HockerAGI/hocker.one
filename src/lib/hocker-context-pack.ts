import { AGI_REGISTRY, APP_REGISTRY } from "@/lib/hocker-dashboard";
import { getHockerPublicPrivateTopologyContext } from "@/lib/hocker-public-private-topology";
import { getHockerProviderOrchestratorPublicContext } from "@/lib/hocker-provider-orchestrator";
import { getRuntimeToolSummary } from "@/lib/agi-runtime-core";
import { getHockerCapabilitiesContract } from "@/lib/hocker-capabilities-contract";
import { getSyntiaOperationalMemorySnapshot } from "@/lib/syntia-operational-memory";
import { getSyntiaMemoryWriteGatePublicContext } from "@/lib/syntia-memory-write-gate";
import { getSyntiaMemoryReviewGatePublicContext } from "@/lib/syntia-memory-review-gate";
import { getSyntiaMemoryPublicationAuditPublicContext } from "@/lib/syntia-memory-publication-audit";
import { getNovaChatActionDraftPublicContext } from "@/lib/nova-chat-action-drafts";
import { getNovaGitHubActionMaterializerPublicContext } from "@/lib/nova-github-action-materializer";

export function getHockerContinuityContextPack(projectId = process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one") {
  const tools = getRuntimeToolSummary();
  const capabilities = getHockerCapabilitiesContract(projectId);

  return {
    ok: true,
    generated_at: new Date().toISOString(),
    project: {
      id: projectId,
      name: "Hocker ONE",
      purpose: "Panel privado operativo del ecosistema HOCKER para coordinar NOVA, AGIs, herramientas reales, aprobación owner, auditoría y ejecución controlada.",
    },
    current_phase: {
      name: "12.7L-2C-A — Provider Orchestrator Inventory + NOVA.AGI sync",
      status: "in_progress",
      objective: "Sincronizar Hocker ONE con el router cognitivo real de NOVA.AGI sin duplicar lógica LLM; NOVA decide proveedor internamente y Hocker ONE conserva Owner Gate para ejecución.",
      previous_stable_phase: "12.7L-2A — App shell aliases + structured data baseline",
      next_target: "12.7L-2C-B — Diagnostics provider router without duplicating NOVA.AGI LLM routing.",
    },
    public_private_topology: {
      ...getHockerPublicPrivateTopologyContext(),
      pwa_lighthouse_diagnostics: {
        version: "12.7L-2B-3",
        status: "active",
        manifest_start_url: "/app/nova",
        header_trace: "12.7L-2B-private-noindex-pwa-baseline",
        lighthouse_status: "diagnostics_required",
        rule: "No avanzar a Fase 13 hasta tener Lighthouse real o error documentado con causa clara.",
      },
      app_shell_aliases: {
        version: "12.7L-2A",
        status: "active",
        routes: ["/app", "/app/nova", "/app/actividad", "/app/pendientes", "/app/ecosistema", "/app/ajustes"],
        compatibility_routes: ["/dashboard", "/chat", "/live", "/commands", "/map", "/owner", "/integrations"],
        rule: "Aliases privados sin eliminar rutas heredadas; todos conservan noindex por header.",
      },
      private_noindex_header_hardening: {
        version: "12.7L-1B",
        status: "active",
        source: "next.config.headers",
        headers: ["X-Robots-Tag", "X-Hocker-Topology"],
        objective: "Forzar noindex/nofollow/noarchive en rutas privadas, protegidas y API sin depender únicamente del middleware.",
      },
    },
    provider_orchestrator_inventory: getHockerProviderOrchestratorPublicContext(),
    non_negotiable_rules: [
      "Nada de escritura directa a main.",
      "Nada de ejecución real sin Owner Gate.",
      "Toda acción sensible debe pasar por agi_action_queue.",
      "Toda ejecución debe guardar execution_result o execution_error.",
      "No inventar integraciones: si falta llave o executor, marcarlo como faltante.",
    ],
    implemented_runtime: {
      github_read: ["get_repo", "list_tree", "read_file", "compare_refs", "audit_paths"],
      github_write_gate: ["create_branch", "upsert_file", "create_pr"],
      github_approved_worker: ["create_branch", "upsert_file", "create_pr"],
      github_guided_execution_chain: ["approve_next_step", "execute_authorized_step", "show_result_or_error"],
      queue_table: "public.agi_action_queue",
      owner_gate: true,
      audit_chain: true,
    },
    apps: APP_REGISTRY.map((app) => ({ key: app.key, title: app.title, status: app.status, category: app.group })),
    agis: AGI_REGISTRY.map((agi) => ({ key: agi.key, title: agi.title, status: agi.status, category: agi.group })),
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
    updated_percentages: {
      hocker_one_private_operational_panel: 84,
      mobile_web_ux_ui: 90,
      agi_runtime_base: 69,
      github_real_tooling: 94,
      owner_gate_operational_security: 84,
      nova_as_real_operator: 72,
      syntia_context_memory: 77,
      real_autonomous_agis: 61,
      complete_real_hocker_ecosystem: 63,
    },
    syntia_operational_memory: {
      version: "12.7F-1",
      status: "available_via_async_context",
      endpoint: "/api/agi/runtime/memory",
      rule: "Solo lectura. No ejecuta acciones ni escribe memoria desde Context Pack.",
    },
    handoff_prompt_for_nova: "Antes de responder o preparar acciones, lee el Context Pack, revisa agi_action_queue, respeta Queue Lock, consulta capabilities_contract y usa syntia_operational_memory como continuidad real. NOVA debe hablar natural, elegir AGI/modelo automáticamente, no fingir integraciones y no iniciar tareas nuevas si hay cola pendiente. Toda acción sensible requiere Owner Gate, pruebas, auditoría y rollback.",
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
      version: "12.7K-2C",
      status: "active",
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
    updated_percentages: {
      ...base.updated_percentages,
      syntia_context_memory: memory.ok ? 82 : base.updated_percentages.syntia_context_memory,
    },
  };
}
