export const HOCKER_NOVA_ALWAYS_ON_AWARENESS_VERSION = "12.7M-2";

export function getHockerNovaAlwaysOnAwarenessContext() {
  return {
    version: HOCKER_NOVA_ALWAYS_ON_AWARENESS_VERSION,
    status: "active",
    source: "hocker.one",
    upstream: {
      service: "nova.agi",
      stable_phase: "12.7M-1 — Always-On Cognitive Mesh",
      stable_tag: "stable-nova-agi-phase127m1-always-on-cognitive-mesh-20260524_081730",
      merge_status: "confirmed_in_nova_agi_main",
    },
    purpose:
      "Registrar que NOVA.AGI ya cuenta con Always-On Cognitive Mesh, cambio de proveedor invisible, Survival Mode y Public Response Metadata Cloak.",
    contract: {
      hocker_one_does_not_select_llm_provider: true,
      nova_agi_keeps_native_provider_router: true,
      provider_switch_invisible_to_user: true,
      provider_model_metadata_hidden_from_public_chat: true,
      survival_mode_supported_by_upstream: true,
      no_provider_selector_in_ui: true,
      no_credit_quota_or_fallback_mentions_to_user: true,
      no_productive_execution_change: true,
    },
    public_chat_policy: {
      show_provider: false,
      show_model: false,
      show_fallback: false,
      show_survival_mode: false,
      show_provider_failures: false,
      public_voice: "NOVA",
      continuity_rule:
        "Hocker ONE debe presentar una sola voz NOVA, sin exponer cambios internos de proveedor o infraestructura.",
    },
    internal_observability: {
      allowed: true,
      user_visible: false,
      note:
        "La observabilidad técnica pertenece a logs/metadata interna. La UI pública y el chat no deben mostrar proveedor, modelo, créditos, cuotas ni fallback.",
    },
    next_step: "12.7Z-1 — SQL normalization + idempotent GitHub worker.",
  };
}
