import type { JsonObject } from "@/lib/types";
import { HOCKER_GLOBAL_REAL_EXECUTION_LOCK, HOCKER_ROLE_DEFINITIONS } from "@/lib/hocker-roles";

export const HOCKER_CLIENT_PORTAL_VERSION = "hocker-client-portals-v0.1.0";
export const HOCKER_SECURITY_READINESS_VERSION = "hocker-security-readiness-v0.1.0";

export const HOCKER_SECURITY_EVENTS = {
  readiness: "security.readiness_check",
  portalGrantRequest: "access.portal_grant_request",
} as const;

export const HOCKER_ONE_OWNER_ONLY = true;
export const HOCKER_ONE_PRIVATE_CORE = true;

export type HockerAccessType = "temporary" | "permanent";
export type HockerPortalStatus = "planned" | "ready" | "locked";
export type HockerPortalRisk = "low" | "medium" | "high" | "critical";

export type HockerClientPortal = {
  portal_id: string;
  name: string;
  brand_scope: string;
  service_family: string;
  status: HockerPortalStatus;
  risk_level: HockerPortalRisk;
  controlled_by: "hocker-one";
  owner_panel_access: true;
  client_panel_access: boolean;
  default_access_type: HockerAccessType;
  modules: string[];
  visible_to_client: string[];
  hidden_from_client: string[];
  allowed_permissions: string[];
  blocked_permissions: string[];
  route_prefix: string;
  notes: string;
};

export const HOCKER_CLIENT_PORTALS: HockerClientPortal[] = [
  {
    portal_id: "hocker-ads-client",
    name: "Hocker Ads Client Portal",
    brand_scope: "Hocker Ads",
    service_family: "marketing_ads",
    status: "planned",
    risk_level: "medium",
    controlled_by: "hocker-one",
    owner_panel_access: true,
    client_panel_access: true,
    default_access_type: "temporary",
    modules: ["campaigns", "creatives", "leads", "reports", "calendar", "support"],
    visible_to_client: ["KPIs", "campañas", "leads", "reportes", "creativos aprobados"],
    hidden_from_client: ["NOVA interna", "SYNTIA completa", "Supabase events", "governance", "global commands"],
    allowed_permissions: ["portal:view", "reports:view", "assets:view", "requests:create"],
    blocked_permissions: ["memory:view", "governance:killswitch", "commands:approve", "chido:real_execute"],
    route_prefix: "/client/hocker-ads",
    notes: "Portal derivado para clientes de publicidad, branding, automatización y performance.",
  },
  {
    portal_id: "hocker-supply-client",
    name: "Hocker Supply Client Portal",
    brand_scope: "Hocker Supply",
    service_family: "commerce_supply",
    status: "planned",
    risk_level: "medium",
    controlled_by: "hocker-one",
    owner_panel_access: true,
    client_panel_access: true,
    default_access_type: "temporary",
    modules: ["products", "orders", "inventory", "tracking", "reports", "support"],
    visible_to_client: ["productos", "órdenes", "inventario permitido", "tracking", "reportes"],
    hidden_from_client: ["proveedores sensibles", "márgenes internos", "comandos globales", "memoria interna"],
    allowed_permissions: ["portal:view", "orders:view", "tracking:view", "requests:create"],
    blocked_permissions: ["orders:force_modify", "payments:real_execute", "memory:view", "governance:killswitch"],
    route_prefix: "/client/supply",
    notes: "Portal derivado para operación comercial y seguimiento de pedidos.",
  },
  {
    portal_id: "hocker-hub-client",
    name: "Hocker Hub Client Portal",
    brand_scope: "Hocker Hub",
    service_family: "crm_automation",
    status: "planned",
    risk_level: "medium",
    controlled_by: "hocker-one",
    owner_panel_access: true,
    client_panel_access: true,
    default_access_type: "temporary",
    modules: ["crm", "pipeline", "automations", "leads", "tasks", "reports"],
    visible_to_client: ["pipeline", "leads", "automatizaciones activas", "tareas", "reportes"],
    hidden_from_client: ["prompts internos", "memoria global", "nodos", "governance"],
    allowed_permissions: ["portal:view", "crm:view", "tasks:view", "reports:view"],
    blocked_permissions: ["crm:mass_delete", "memory:view", "commands:approve", "governance:killswitch"],
    route_prefix: "/client/hub",
    notes: "Portal derivado para CRM, automatización y operación comercial.",
  },
  {
    portal_id: "chido-operator-console",
    name: "Chido Operator Console",
    brand_scope: "Chido Casino",
    service_family: "casino_operations",
    status: "locked",
    risk_level: "critical",
    controlled_by: "hocker-one",
    owner_panel_access: true,
    client_panel_access: false,
    default_access_type: "temporary",
    modules: ["ops_read_only", "dry_run", "approvals", "signature", "preflight"],
    visible_to_client: ["estado operativo permitido", "dry-run", "preflight bloqueado"],
    hidden_from_client: ["balances reales", "pagos reales", "apuestas reales", "governance", "SYNTIA completa"],
    allowed_permissions: ["chido:view", "chido:ops:view", "chido:dry_run", "chido:preflight"],
    blocked_permissions: ["chido:real_execute", "modify_balance", "pay_withdrawal", "execute_bet"],
    route_prefix: "/operator/chido",
    notes: "Consola derivada controlada para operadores autorizados. Ejecución real bloqueada.",
  },
  {
    portal_id: "trackhok-client",
    name: "Trackhok Client Panel",
    brand_scope: "Trackhok IA",
    service_family: "tracking_security",
    status: "planned",
    risk_level: "high",
    controlled_by: "hocker-one",
    owner_panel_access: true,
    client_panel_access: true,
    default_access_type: "temporary",
    modules: ["devices", "locations", "alerts", "reports"],
    visible_to_client: ["dispositivos permitidos", "ubicaciones autorizadas", "alertas", "reportes"],
    hidden_from_client: ["nodos internos", "predicción interna", "comandos sensibles", "memoria global"],
    allowed_permissions: ["portal:view", "devices:view", "reports:view"],
    blocked_permissions: ["devices:covert_control", "memory:view", "governance:killswitch"],
    route_prefix: "/client/trackhok",
    notes: "Portal derivado para rastreo autorizado y monitoreo de dispositivos permitidos.",
  },
  {
    portal_id: "nexpa-client",
    name: "NEXPA Guardian Panel",
    brand_scope: "NEXPA IA",
    service_family: "parental_security",
    status: "planned",
    risk_level: "critical",
    controlled_by: "hocker-one",
    owner_panel_access: true,
    client_panel_access: true,
    default_access_type: "temporary",
    modules: ["guardians", "devices", "alerts", "reports"],
    visible_to_client: ["dispositivos autorizados", "alertas", "reportes", "estado de protección"],
    hidden_from_client: ["comandos invisibles", "núcleo de seguridad", "memoria global", "governance"],
    allowed_permissions: ["portal:view", "guardians:view", "reports:view"],
    blocked_permissions: ["remote:covert_control", "memory:view", "governance:killswitch"],
    route_prefix: "/client/nexpa",
    notes: "Portal derivado para seguridad familiar bajo consentimiento y control explícito.",
  },
];

export function getHockerClientPortal(portalId: string): HockerClientPortal | null {
  return HOCKER_CLIENT_PORTALS.find((portal) => portal.portal_id === portalId) ?? null;
}

export function getOwnerSecurityMatrix(): JsonObject {
  return {
    hocker_one_owner_only: HOCKER_ONE_OWNER_ONLY,
    hocker_one_private_core: HOCKER_ONE_PRIVATE_CORE,
    owner_control: "Hocker ONE controla portales derivados, accesos, módulos y permisos.",
    access_types: ["temporary", "permanent"],
    role_count: HOCKER_ROLE_DEFINITIONS.length,
    roles: HOCKER_ROLE_DEFINITIONS.map((role) => ({
      role: role.role,
      can_execute_real_actions: role.can_execute_real_actions,
      permissions: role.permissions,
    })),
    global_execution_lock: HOCKER_GLOBAL_REAL_EXECUTION_LOCK,
    client_portal_count: HOCKER_CLIENT_PORTALS.length,
    client_portals: HOCKER_CLIENT_PORTALS.map((portal) => ({
      portal_id: portal.portal_id,
      name: portal.name,
      status: portal.status,
      risk_level: portal.risk_level,
      route_prefix: portal.route_prefix,
      client_panel_access: portal.client_panel_access,
      default_access_type: portal.default_access_type,
    })),
  } as unknown as JsonObject;
}

export function evaluateSecurityReadiness() {
  const portalsControlledByHockerOne = HOCKER_CLIENT_PORTALS.every((portal) => portal.controlled_by === "hocker-one");
  const realExecutionPermissionPattern = /(real_execute|execute_bet|modify_balance|pay_withdrawal|force_modify|covert_control|killswitch)/i;
  const noPortalRealExecution = HOCKER_CLIENT_PORTALS.every((portal) =>
    portal.allowed_permissions.every((permission) => !realExecutionPermissionPattern.test(permission)) &&
    (portal.risk_level !== "critical" || portal.blocked_permissions.some((permission) => realExecutionPermissionPattern.test(permission))),
  );
  const rolesLocked = HOCKER_ROLE_DEFINITIONS.every((role) => role.can_execute_real_actions === false);

  const checks = [
    {
      id: "owner-only-core",
      label: "Hocker ONE privado",
      status: HOCKER_ONE_OWNER_ONLY && HOCKER_ONE_PRIVATE_CORE ? "ready" : "blocked",
      ok: HOCKER_ONE_OWNER_ONLY && HOCKER_ONE_PRIVATE_CORE,
      critical: true,
      detail: "Hocker ONE queda definido como panel maestro privado, no como portal de clientes.",
    },
    {
      id: "client-portal-derivatives",
      label: "Portales derivados",
      status: portalsControlledByHockerOne ? "ready" : "blocked",
      ok: portalsControlledByHockerOne,
      critical: true,
      detail: `${HOCKER_CLIENT_PORTALS.length} portales derivados declarados y controlados por Hocker ONE.`,
    },
    {
      id: "roles-real-execution-lock",
      label: "Roles sin ejecución real",
      status: rolesLocked && HOCKER_GLOBAL_REAL_EXECUTION_LOCK ? "ready" : "blocked",
      ok: rolesLocked && HOCKER_GLOBAL_REAL_EXECUTION_LOCK,
      critical: true,
      detail: `roles=${HOCKER_ROLE_DEFINITIONS.length}; execution_lock=${HOCKER_GLOBAL_REAL_EXECUTION_LOCK}`,
    },
    {
      id: "critical-portal-locks",
      label: "Bloqueos en portales críticos",
      status: noPortalRealExecution ? "ready" : "blocked",
      ok: noPortalRealExecution,
      critical: true,
      detail: "Los portales críticos quedan sin ejecución real por defecto.",
    },
    {
      id: "temporary-permanent-access",
      label: "Acceso temporal/permanente",
      status: "ready",
      ok: true,
      critical: false,
      detail: "La base permite modelar accesos temporales o permanentes por portal, módulo y permiso.",
    },
  ];

  const summary = {
    total: checks.length,
    ready: checks.filter((check) => check.status === "ready").length,
    blocked: checks.filter((check) => check.status === "blocked").length,
    critical_blocked: checks.filter((check) => check.critical && check.status === "blocked").length,
  };

  return {
    ok: summary.critical_blocked === 0,
    status: summary.critical_blocked === 0 ? "ready" : "blocked",
    version: HOCKER_SECURITY_READINESS_VERSION,
    summary,
    checks,
    matrix: getOwnerSecurityMatrix(),
  };
}
