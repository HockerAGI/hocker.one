import { AGI_REGISTRY, APP_REGISTRY } from "@/lib/hocker-dashboard";
import { getRuntimeToolSummary } from "@/lib/agi-runtime-core";
import { getHockerCapabilitiesContract } from "@/lib/hocker-capabilities-contract";

export function getHockerContinuityContextPack() {
  const tools = getRuntimeToolSummary();
  const projectId = process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one";
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
      name: "12.7E — Capabilities Contract + Tool Router real",
      status: "in_progress",
      objective: "Formalizar qué puede hacer NOVA, qué solo puede preparar, qué requiere Owner Gate, qué integración falta y qué AGI corresponde.",
      previous_stable_phase: "12.7D — NOVA AGI Policy Sync + Railway runtime validado",
      next_target: "12.7F — Syntia Context Memory operational. No avanzar a Fase 13 hasta cerrar executors reales adicionales y memoria operacional.",
    },
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
      mobile_web_ux_ui: 85,
      agi_runtime_base: 69,
      github_real_tooling: 92,
      owner_gate_operational_security: 84,
      nova_as_real_operator: 62,
      syntia_context_memory: 77,
      real_autonomous_agis: 58,
      complete_real_hocker_ecosystem: 61,
    },
    handoff_prompt_for_nova: "Antes de responder o preparar acciones, lee el Context Pack, revisa agi_action_queue, respeta Queue Lock y consulta capabilities_contract. NOVA debe hablar natural, elegir AGI/modelo automáticamente, no fingir integraciones y no iniciar tareas nuevas si hay cola pendiente. Toda acción sensible requiere Owner Gate, pruebas, auditoría y rollback.",
  };
}
