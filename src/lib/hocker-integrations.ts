export const HOCKER_INTEGRATION_REGISTRY_VERSION = "hocker-integration-registry-v0.1.0";

export const HOCKER_INTEGRATION_EVENTS = {
  registered: "integration.registered",
  healthCheck: "integration.health_check",
  event: "integration.event",
} as const;

export type HockerIntegrationType = "app" | "agi" | "api" | "node" | "webhook" | "service";

export type HockerIntegrationActionsMode =
  | "read_only"
  | "dry_run"
  | "approval"
  | "signed"
  | "preflight_locked"
  | "policy_locked"
  | "disabled";

export type HockerIntegrationStatus = "online" | "degraded" | "offline" | "unknown";

export type HockerIntegrationContract = {
  module_id: string;
  name: string;
  type: HockerIntegrationType;
  status: HockerIntegrationStatus;
  description: string;
  health_endpoint: string;
  dashboard_path: string;
  actions_mode: HockerIntegrationActionsMode;
  real_execution_enabled: false;
  execution_lock: true;
  responsible_agis: string[];
  capabilities: string[];
  required_chain: string[];
  risk_level: "low" | "medium" | "high" | "critical";
  registry_version: string;
};

export const CHIDO_CANONICAL_INTEGRATION: HockerIntegrationContract = {
  module_id: "chido-casino",
  name: "Chido Casino",
  type: "app",
  status: "unknown",
  description: "Primer módulo canónico externo integrado a Hocker ONE en modo monitoreo, auditoría y preflight bloqueado.",
  health_endpoint: "https://chido-casino.vercel.app/api/system/status?emit_event=1",
  dashboard_path: "/chido",
  actions_mode: "preflight_locked",
  real_execution_enabled: false,
  execution_lock: true,
  responsible_agis: [
    "nova",
    "chido_gerente",
    "chido_wins",
    "numia",
    "vertx",
    "jurix",
    "syntia",
  ],
  capabilities: [
    "monitoring",
    "read_only_ops",
    "dry_run",
    "approval_layer",
    "hmac_signature",
    "execution_preflight",
    "syntia_memory",
    "audit_events",
  ],
  required_chain: [
    "register",
    "health",
    "events",
    "read_only",
    "dry_run",
    "approval",
    "signature",
    "preflight",
    "policy",
  ],
  risk_level: "critical",
  registry_version: HOCKER_INTEGRATION_REGISTRY_VERSION,
};

export const CANONICAL_INTEGRATIONS: HockerIntegrationContract[] = [
  CHIDO_CANONICAL_INTEGRATION,
];

export function getCanonicalIntegration(moduleId: string): HockerIntegrationContract | null {
  return CANONICAL_INTEGRATIONS.find((item) => item.module_id === moduleId) ?? null;
}

export function normalizeIntegrationStatus(value: unknown): HockerIntegrationStatus {
  const text = String(value || "").toLowerCase();

  if (text === "online") return "online";
  if (text === "degraded") return "degraded";
  if (text === "offline") return "offline";

  return "unknown";
}
