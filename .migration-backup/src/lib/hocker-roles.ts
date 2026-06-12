export const HOCKER_ACCESS_POLICY_VERSION = "hocker-access-policy-v0.1.0";

export const HOCKER_ACCESS_EVENTS = {
  policy: "access.policy",
  check: "access.check",
} as const;

export const HOCKER_GLOBAL_REAL_EXECUTION_LOCK = true;

export type HockerRole =
  | "admin"
  | "operator"
  | "viewer"
  | "auditor"
  | "agi-service"
  | "node-agent";

export type HockerPermission =
  | "dashboard:view"
  | "status:view"
  | "integrations:view"
  | "integrations:register"
  | "integrations:emit_event"
  | "nodes:view"
  | "nodes:heartbeat"
  | "memory:view"
  | "commands:view"
  | "commands:request"
  | "commands:approve"
  | "commands:reject"
  | "governance:view"
  | "governance:killswitch"
  | "chido:view"
  | "chido:ops:view"
  | "chido:dry_run"
  | "chido:approval_request"
  | "chido:guardian_decision"
  | "chido:signature_check"
  | "chido:preflight"
  | "chido:policy:view"
  | "chido:real_execute"
  | "access:view"
  | "access:check"
  | "access:manage";

export type HockerRoleDefinition = {
  role: HockerRole;
  label: string;
  description: string;
  permissions: HockerPermission[];
  can_execute_real_actions: false;
};

const VIEW_PERMISSIONS: HockerPermission[] = [
  "dashboard:view",
  "status:view",
  "integrations:view",
  "nodes:view",
  "memory:view",
  "commands:view",
  "governance:view",
  "chido:view",
  "chido:ops:view",
  "chido:policy:view",
  "access:view",
  "access:check",
];

export const HOCKER_ROLE_DEFINITIONS: HockerRoleDefinition[] = [
  {
    role: "admin",
    label: "Admin",
    description: "Control total administrativo de Hocker ONE, sin ejecución real desbloqueada.",
    permissions: [
      ...VIEW_PERMISSIONS,
      "integrations:register",
      "integrations:emit_event",
      "commands:request",
      "commands:approve",
      "commands:reject",
      "governance:killswitch",
      "chido:dry_run",
      "chido:approval_request",
      "chido:guardian_decision",
      "chido:signature_check",
      "chido:preflight",
      "access:manage",
    ],
    can_execute_real_actions: false,
  },
  {
    role: "operator",
    label: "Operator",
    description: "Operación diaria controlada: puede solicitar, revisar y preflight, sin ejecución real.",
    permissions: [
      ...VIEW_PERMISSIONS,
      "commands:request",
      "chido:dry_run",
      "chido:approval_request",
      "chido:signature_check",
      "chido:preflight",
      "integrations:emit_event",
    ],
    can_execute_real_actions: false,
  },
  {
    role: "viewer",
    label: "Viewer",
    description: "Solo lectura para monitoreo y consulta.",
    permissions: [
      "dashboard:view",
      "status:view",
      "integrations:view",
      "nodes:view",
      "chido:view",
      "access:view",
      "access:check",
    ],
    can_execute_real_actions: false,
  },
  {
    role: "auditor",
    label: "Auditor",
    description: "Lectura ampliada para auditoría, memoria, eventos y trazabilidad.",
    permissions: [
      ...VIEW_PERMISSIONS,
      "integrations:emit_event",
    ],
    can_execute_real_actions: false,
  },
  {
    role: "agi-service",
    label: "AGI Service",
    description: "Rol de servicio para AGIs conectadas. Puede emitir eventos y solicitar checks, no ejecutar acciones reales.",
    permissions: [
      "status:view",
      "integrations:view",
      "integrations:emit_event",
      "memory:view",
      "commands:request",
      "chido:view",
      "chido:dry_run",
      "chido:approval_request",
      "access:check",
    ],
    can_execute_real_actions: false,
  },
  {
    role: "node-agent",
    label: "Node Agent",
    description: "Rol técnico para nodos/agentes. Puede reportar estado y eventos operativos.",
    permissions: [
      "status:view",
      "nodes:heartbeat",
      "integrations:emit_event",
      "access:check",
    ],
    can_execute_real_actions: false,
  },
];

export function getHockerRoleDefinition(role: string): HockerRoleDefinition | null {
  return HOCKER_ROLE_DEFINITIONS.find((item) => item.role === role) ?? null;
}

export function normalizeHockerRole(value: unknown): HockerRole {
  const text = String(value || "").trim().toLowerCase();

  if (
    text === "admin" ||
    text === "operator" ||
    text === "viewer" ||
    text === "auditor" ||
    text === "agi-service" ||
    text === "node-agent"
  ) {
    return text;
  }

  return "viewer";
}

export function normalizePermission(value: unknown): HockerPermission | null {
  const text = String(value || "").trim() as HockerPermission;

  const all = new Set(
    HOCKER_ROLE_DEFINITIONS.flatMap((role) => role.permissions),
  );

  if (all.has(text)) return text;

  if (text === "chido:real_execute") return text;

  return null;
}

export function checkHockerPermission(args: {
  role: HockerRole;
  permission: HockerPermission;
  module_id?: string;
  action_id?: string;
}) {
  const definition = getHockerRoleDefinition(args.role);

  if (!definition) {
    return {
      allowed: false,
      reason: "role_not_found",
      execution_lock: HOCKER_GLOBAL_REAL_EXECUTION_LOCK,
      real_execution_enabled: false,
    };
  }

  if (args.permission === "chido:real_execute") {
    return {
      allowed: false,
      reason: "global_real_execution_lock",
      execution_lock: HOCKER_GLOBAL_REAL_EXECUTION_LOCK,
      real_execution_enabled: false,
    };
  }

  const allowed = definition.permissions.includes(args.permission);

  return {
    allowed,
    reason: allowed ? "permission_granted" : "permission_denied",
    execution_lock: HOCKER_GLOBAL_REAL_EXECUTION_LOCK,
    real_execution_enabled: false,
  };
}

export function getDefaultHockerRole(): HockerRole {
  return normalizeHockerRole(process.env.HOCKER_ONE_DEFAULT_ROLE || "admin");
}
