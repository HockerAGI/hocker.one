export type ChidoRiskLevel = "low" | "medium" | "high" | "critical";

export type ChidoActionContract = {
  id: string;
  label: string;
  description: string;
  riskLevel: ChidoRiskLevel;
  guardianAgis: string[];
  requiredBeforeRealExecution: string[];
  dryRunAvailable: boolean;
  realExecutionEnabled: false;
  sensitive: boolean;
};

export const CHIDO_ACTION_CONTRACT_VERSION = "chido-actions-v0.1.0";

export const CHIDO_ACTIONS_CONTRACT: ChidoActionContract[] = [
  {
    id: "approve_kyc",
    label: "Aprobar KYC",
    description: "Intención futura para aprobar una solicitud KYC. Actualmente solo dry-run.",
    riskLevel: "high",
    guardianAgis: ["jurix", "vertx", "chido_gerente"],
    requiredBeforeRealExecution: ["explicit_approval", "audit_log", "hmac_signature", "jurix_guardian", "vertx_guardian"],
    dryRunAvailable: true,
    realExecutionEnabled: false,
    sensitive: true,
  },
  {
    id: "confirm_deposit",
    label: "Confirmar depósito",
    description: "Intención futura para confirmar depósito manual. Actualmente solo dry-run.",
    riskLevel: "critical",
    guardianAgis: ["numia", "vertx", "chido_gerente"],
    requiredBeforeRealExecution: ["explicit_approval", "audit_log", "hmac_signature", "numia_guardian", "vertx_guardian"],
    dryRunAvailable: true,
    realExecutionEnabled: false,
    sensitive: true,
  },
  {
    id: "reject_deposit",
    label: "Rechazar depósito",
    description: "Intención futura para rechazar depósito manual. Actualmente solo dry-run.",
    riskLevel: "high",
    guardianAgis: ["numia", "jurix", "chido_gerente"],
    requiredBeforeRealExecution: ["explicit_approval", "audit_log", "hmac_signature", "numia_guardian", "jurix_guardian"],
    dryRunAvailable: true,
    realExecutionEnabled: false,
    sensitive: true,
  },
  {
    id: "pay_withdrawal",
    label: "Pagar retiro",
    description: "Intención futura para procesar retiro. Actualmente solo dry-run.",
    riskLevel: "critical",
    guardianAgis: ["numia", "vertx", "jurix", "chido_gerente"],
    requiredBeforeRealExecution: ["explicit_approval", "audit_log", "hmac_signature", "numia_guardian", "vertx_guardian", "jurix_guardian"],
    dryRunAvailable: true,
    realExecutionEnabled: false,
    sensitive: true,
  },
  {
    id: "modify_balance",
    label: "Modificar balance",
    description: "Intención futura para ajuste de balance. Actualmente solo dry-run.",
    riskLevel: "critical",
    guardianAgis: ["numia", "vertx", "jurix", "chido_gerente"],
    requiredBeforeRealExecution: ["explicit_approval", "audit_log", "hmac_signature", "numia_guardian", "vertx_guardian", "jurix_guardian"],
    dryRunAvailable: true,
    realExecutionEnabled: false,
    sensitive: true,
  },
];

export const CHIDO_PERMANENTLY_BLOCKED_ACTIONS = [
  {
    id: "execute_bet",
    label: "Ejecutar apuesta",
    reason: "Hocker ONE no debe ejecutar apuestas reales ni prometer ganancias.",
    guardianAgis: ["jurix", "vertx", "chido_wins", "nova"],
  },
] as const;

export function getChidoActionContract(actionId: string): ChidoActionContract | undefined {
  return CHIDO_ACTIONS_CONTRACT.find((action) => action.id === actionId);
}

export function isChidoBlockedAction(actionId: string): boolean {
  return CHIDO_PERMANENTLY_BLOCKED_ACTIONS.some((action) => action.id === actionId);
}

export function getChidoBlockedAction(actionId: string) {
  return CHIDO_PERMANENTLY_BLOCKED_ACTIONS.find((action) => action.id === actionId);
}
