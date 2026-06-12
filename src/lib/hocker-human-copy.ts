export const HOCKER_HUMAN_COPY = {
  app_name: "Hocker ONE",
  product_category: "AI Command OS",
  public_tagline: "Tu empresa operando desde una sola inteligencia.",
  private_tagline: "NOVA está lista. ¿Qué movemos hoy?",
  sales_tagline: "Crea, analiza, automatiza y ejecuta con IA bajo control humano.",

  runtime_tools_partial: "Algunas funciones avanzadas todavía se están preparando.",
  action_needs_approval: "Necesito tu aprobación antes de continuar.",
  action_executed: "Listo. La acción se completó y guardé la evidencia.",
  action_failed: "No pude completar esta acción. Guardé el error sin afectar el sistema.",
  action_prepared: "Preparé una acción segura para revisión.",
  action_rejected: "Listo. La acción fue rechazada y no se ejecutó.",
  action_rolled_back: "La acción fue revertida y la evidencia quedó guardada.",

  memory_pending: "Tengo un aprendizaje nuevo esperando revisión.",
  memory_clean: "La memoria está en orden.",
  integration_disconnected: "Esta conexión necesita configurarse.",
  protected_module: "Este módulo está protegido y requiere autorización especial.",
  no_pending_actions: "Todo está tranquilo. No hay acciones pendientes.",

  error_generic: "No pude completar esta acción. Guardé el error para revisarlo sin riesgo.",
  error_forbidden: "Esta sección requiere autorización.",
  error_offline: "No tengo conexión suficiente para actualizar esta vista.",
  loading_default: "Preparando la información...",
  empty_default: "Nada pendiente por ahora.",

  owner_gate_human: "Necesito tu aprobación.",
  queue_human: "Pendientes",
  system_health_human: "Estado del sistema",
  capabilities_human: "Lo que NOVA puede hacer",
  memory_review_human: "Aprendizaje",
  github_chain_human: "Cambios en código",
} as const;

export type HockerHumanCopyKey = keyof typeof HOCKER_HUMAN_COPY;

export function hockerCopy(key: HockerHumanCopyKey): string {
  return HOCKER_HUMAN_COPY[key];
}

