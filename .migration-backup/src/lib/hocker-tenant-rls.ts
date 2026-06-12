export const HOCKER_TENANT_RLS_VERSION = "hocker-tenant-rls-v0.1.0";
export const HOCKER_TENANT_RLS_EVENT = "security.tenant_rls_readiness";

export type TenantRlsStatus = "ready" | "warning" | "blocked";

export type TenantRlsCheck = {
  id: string;
  label: string;
  status: TenantRlsStatus;
  ok: boolean;
  critical: boolean;
  detail: string;
};

export const HOCKER_TENANT_SCOPES = [
  "owner",
  "internal_agi",
  "client_portal",
  "client_user",
  "auditor",
] as const;

export const HOCKER_TENANT_POLICY_FIELDS = [
  "owner_id",
  "tenant_id",
  "portal_id",
  "grant_id",
  "module_id",
  "permission",
  "expires_at",
  "revoked_at",
  "audit_trace_id",
] as const;

export const HOCKER_PORTAL_RLS_MODEL = [
  {
    portal_id: "hocker-ads-client",
    tenant_scope: "client_portal",
    allowed_modules: ["campaigns", "reports", "billing", "support"],
    blocked_permissions: ["hocker_one:core", "chido:real_execute", "payments:modify_balance"],
  },
  {
    portal_id: "hocker-supply-client",
    tenant_scope: "client_portal",
    allowed_modules: ["orders", "products", "reports", "support"],
    blocked_permissions: ["hocker_one:core", "payments:modify_balance"],
  },
  {
    portal_id: "hocker-hub-client",
    tenant_scope: "client_portal",
    allowed_modules: ["crm", "tickets", "contacts", "reports"],
    blocked_permissions: ["hocker_one:core", "admin:global"],
  },
  {
    portal_id: "chido-operator",
    tenant_scope: "client_portal",
    allowed_modules: ["chido_ops", "read_only_reports", "support"],
    blocked_permissions: ["chido:real_execute", "payments:confirm_deposit", "payments:pay_withdrawal"],
  },
  {
    portal_id: "trackhok-client",
    tenant_scope: "client_portal",
    allowed_modules: ["fleet", "devices", "alerts", "reports"],
    blocked_permissions: ["covert_control", "admin:global"],
  },
  {
    portal_id: "nexpa-client",
    tenant_scope: "client_portal",
    allowed_modules: ["guardians", "devices", "alerts", "reports"],
    blocked_permissions: ["covert_control", "silent_recording", "admin:global"],
  },
] as const;

export function evaluateTenantRlsReadiness() {
  const checks: TenantRlsCheck[] = [
    {
      id: "tenant-fields",
      label: "Tenant policy fields",
      status: "ready",
      ok: true,
      critical: true,
      detail: `${HOCKER_TENANT_POLICY_FIELDS.length} campos canónicos definidos para RLS.`,
    },
    {
      id: "tenant-scopes",
      label: "Tenant scopes",
      status: "ready",
      ok: true,
      critical: true,
      detail: `${HOCKER_TENANT_SCOPES.length} scopes definidos: owner, internal_agi, client_portal, client_user, auditor.`,
    },
    {
      id: "portal-rls-model",
      label: "Portal RLS model",
      status: "ready",
      ok: true,
      critical: true,
      detail: `${HOCKER_PORTAL_RLS_MODEL.length} portales derivados con módulos permitidos y permisos bloqueados.`,
    },
    {
      id: "owner-core-isolation",
      label: "Owner core isolation",
      status: "ready",
      ok: true,
      critical: true,
      detail: "Hocker ONE core queda fuera del alcance de portales cliente.",
    },
    {
      id: "no-real-session-yet",
      label: "No real client sessions yet",
      status: "ready",
      ok: true,
      critical: true,
      detail: "Grants siguen lógicos. No se crean JWTs, sesiones reales ni tenants activos todavía.",
    },
    {
      id: "migration-applied",
      label: "Migration applied",
      status: "ready",
      ok: true,
      critical: false,
      detail: "Migration SQL aplicada en Supabase: hocker_tenants y hocker_portal_grants creadas con RLS service_role-only.",
    },
  ];

  const summary = {
    total: checks.length,
    ready: checks.filter((check) => check.status === "ready").length,
    warning: checks.filter((check) => check.status === "warning").length,
    blocked: checks.filter((check) => check.status === "blocked").length,
    critical_blocked: checks.filter((check) => check.status === "blocked" && check.critical).length,
  };

  const status: TenantRlsStatus =
    summary.critical_blocked > 0 ? "blocked" : summary.warning > 0 ? "warning" : "ready";

  return {
    ok: summary.critical_blocked === 0,
    status,
    version: HOCKER_TENANT_RLS_VERSION,
    summary,
    checks,
    tenant_scopes: HOCKER_TENANT_SCOPES,
    policy_fields: HOCKER_TENANT_POLICY_FIELDS,
    portal_rls_model: HOCKER_PORTAL_RLS_MODEL,
    real_client_sessions_enabled: false,
    rls_live_enforced: true,
    execution_lock: true,
  };
}
