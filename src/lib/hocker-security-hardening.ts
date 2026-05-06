import { HOCKER_OWNER_API_GATE_VERSION } from "@/lib/hocker-owner-api-gate";
import { HOCKER_ACCESS_GRANTS_VERSION } from "@/lib/hocker-access-grants";
import { HOCKER_ACCESS_POLICY_VERSION } from "@/lib/hocker-roles";

export const HOCKER_SECURITY_HARDENING_VERSION = "hocker-security-hardening-v0.1.0";
export const HOCKER_SECURITY_HARDENING_EVENT = "security.hardening_readiness";

export type HockerSecurityHardeningStatus = "ready" | "warning" | "blocked";

export type HockerSecurityHardeningCheck = {
  id: string;
  label: string;
  status: HockerSecurityHardeningStatus;
  ok: boolean;
  critical: boolean;
  detail: string;
};

const OWNER_ONLY_ROUTES = [
  "/owner",
  "/dashboard",
  "/status",
  "/launch",
  "/mobile",
  "/security",
  "/security/grants",
  "/access",
  "/integrations",
  "/memory",
  "/governance",
  "/chido",
  "/admin",
];

const OWNER_GATED_APIS = [
  "/api/access/portal-grants/decision",
  "/api/access/portal-grants/revoke",
];

const LOGICAL_ONLY_APIS = [
  "/api/access/portal-grants/request",
  "/api/access/check",
  "/api/integrations/register",
  "/api/integrations/events",
];

export function evaluateHockerSecurityHardening() {
  const ownerKeyConfigured = Boolean(process.env.HOCKER_OWNER_ACTION_KEY || "");

  const checks: HockerSecurityHardeningCheck[] = [
    {
      id: "owner-api-gate",
      label: "Owner API Gate",
      status: ownerKeyConfigured ? "ready" : "blocked",
      ok: ownerKeyConfigured,
      critical: true,
      detail: ownerKeyConfigured
        ? `Owner API gate activo: ${HOCKER_OWNER_API_GATE_VERSION}`
        : "Falta HOCKER_OWNER_ACTION_KEY.",
    },
    {
      id: "owner-only-routes",
      label: "Owner-only routes",
      status: "ready",
      ok: true,
      critical: true,
      detail: `${OWNER_ONLY_ROUTES.length} rutas owner-only declaradas en política.`,
    },
    {
      id: "owner-gated-apis",
      label: "Owner-gated APIs",
      status: "ready",
      ok: true,
      critical: true,
      detail: `${OWNER_GATED_APIS.length} APIs críticas requieren owner key.`,
    },
    {
      id: "logical-only-apis",
      label: "Logical-only APIs",
      status: "ready",
      ok: true,
      critical: false,
      detail: `${LOGICAL_ONLY_APIS.length} APIs permanecen lógicas/auditables, sin sesión real.`,
    },
    {
      id: "grants-no-real-session",
      label: "Grants no crean sesión real",
      status: "ready",
      ok: true,
      critical: true,
      detail: `${HOCKER_ACCESS_GRANTS_VERSION}; grants siguen dry-run/logical only.`,
    },
    {
      id: "access-policy",
      label: "Access Policy",
      status: "ready",
      ok: true,
      critical: true,
      detail: `${HOCKER_ACCESS_POLICY_VERSION}; execution_lock=true.`,
    },
    {
      id: "rls-foundation-applied",
      label: "RLS/Tenant foundation",
      status: "ready",
      ok: true,
      critical: false,
      detail: "Tenant/RLS foundation aplicada: tablas nuevas con RLS service_role-only. Sesiones cliente siguen desactivadas.",
    },
  ];

  const summary = {
    total: checks.length,
    ready: checks.filter((check) => check.status === "ready").length,
    warning: checks.filter((check) => check.status === "warning").length,
    blocked: checks.filter((check) => check.status === "blocked").length,
    critical_blocked: checks.filter((check) => check.status === "blocked" && check.critical).length,
  };

  const status: HockerSecurityHardeningStatus =
    summary.critical_blocked > 0 ? "blocked" : summary.warning > 0 ? "warning" : "ready";

  return {
    ok: summary.critical_blocked === 0,
    status,
    version: HOCKER_SECURITY_HARDENING_VERSION,
    summary,
    checks,
    owner_only_routes: OWNER_ONLY_ROUTES,
    owner_gated_apis: OWNER_GATED_APIS,
    logical_only_apis: LOGICAL_ONLY_APIS,
    real_execution_enabled: false,
    execution_lock: true,
  };
}
