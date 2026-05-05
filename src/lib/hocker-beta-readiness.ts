import { createAdminSupabase } from "@/lib/supabase-admin";
import type { JsonObject } from "@/lib/types";
import { collectHockerGlobalHealth } from "@/lib/hocker-global-health";
import { CANONICAL_INTEGRATIONS } from "@/lib/hocker-integrations";
import {
  HOCKER_GLOBAL_REAL_EXECUTION_LOCK,
  HOCKER_ROLE_DEFINITIONS,
} from "@/lib/hocker-roles";

export const HOCKER_BETA_READINESS_VERSION = "hocker-beta-readiness-v0.1.0";
export const HOCKER_BETA_READINESS_EVENT = "beta.readiness_check";

export type BetaReadinessStatus = "ready" | "warning" | "blocked";

export type BetaReadinessCheck = {
  id: string;
  label: string;
  status: BetaReadinessStatus;
  ok: boolean;
  critical: boolean;
  detail: string;
  data?: JsonObject;
};

export type BetaReadinessResult = {
  ok: boolean;
  status: BetaReadinessStatus;
  version: string;
  checked_at: string;
  summary: {
    total: number;
    ready: number;
    warning: number;
    blocked: number;
    critical_blocked: number;
  };
  checks: BetaReadinessCheck[];
};

const RELEASED_ROUTE_MANIFEST = new Set([
  "/dashboard",
  "/status",
  "/integrations",
  "/access",
  "/launch",
  "/memory",
  "/nodes",
  "/commands",
  "/governance",
  "/chido",
]);

const RELEASED_DOC_MANIFEST = new Set([
  "docs/HOCKER_ONE_LAUNCH_CHECKLIST.md",
  "docs/HOCKER_ONE_OPERATOR_MANUAL.md",
  "docs/HOCKER_ONE_INTEGRATION_CONTRACT.md",
]);

function routeExists(path: string): boolean {
  return RELEASED_ROUTE_MANIFEST.has(path);
}

function fileExists(path: string): boolean {
  return RELEASED_DOC_MANIFEST.has(path);
}

function makeCheck(args: BetaReadinessCheck): BetaReadinessCheck {
  return args;
}

function summarize(checks: BetaReadinessCheck[]): BetaReadinessResult["summary"] {
  return {
    total: checks.length,
    ready: checks.filter((item) => item.status === "ready").length,
    warning: checks.filter((item) => item.status === "warning").length,
    blocked: checks.filter((item) => item.status === "blocked").length,
    critical_blocked: checks.filter((item) => item.critical && item.status === "blocked").length,
  };
}

function overallStatus(summary: BetaReadinessResult["summary"]): BetaReadinessStatus {
  if (summary.critical_blocked > 0) return "blocked";
  if (summary.warning > 0 || summary.blocked > 0) return "warning";
  return "ready";
}

async function recentMemoryCount(): Promise<number> {
  try {
    const sb = createAdminSupabase();

    const { data } = await sb
      .from("events")
      .select("id")
      .eq("project_id", "hocker-one")
      .like("type", "memory.%")
      .order("created_at", { ascending: false })
      .limit(5);

    return data?.length ?? 0;
  } catch {
    return 0;
  }
}

export async function collectHockerBetaReadiness(args?: { emitEvent?: boolean }): Promise<BetaReadinessResult & { event_id?: string }> {
  const globalHealth = await collectHockerGlobalHealth({ emitEvent: false });
  const chido = CANONICAL_INTEGRATIONS.find((item) => item.module_id === "chido-casino");
  const memoryItems = await recentMemoryCount();

  const requiredRoutes = [
    "/dashboard",
    "/status",
    "/integrations",
    "/access",
    "/launch",
    "/memory",
    "/nodes",
    "/commands",
    "/governance",
    "/chido",
  ];

  const missingRoutes = requiredRoutes.filter((route) => !routeExists(route));

  const docs = [
    "docs/HOCKER_ONE_LAUNCH_CHECKLIST.md",
    "docs/HOCKER_ONE_OPERATOR_MANUAL.md",
    "docs/HOCKER_ONE_INTEGRATION_CONTRACT.md",
  ];

  const missingDocs = docs.filter((doc) => !fileExists(doc));
  const rolesWithRealExecution = HOCKER_ROLE_DEFINITIONS.filter((role) => role.can_execute_real_actions !== false);

  const checks: BetaReadinessCheck[] = [
    makeCheck({
      id: "global-health",
      label: "Global Health Center",
      status: globalHealth.summary.critical_offline === 0 ? "ready" : "blocked",
      ok: globalHealth.summary.critical_offline === 0,
      critical: true,
      detail: `Global status ${globalHealth.status}; critical_offline=${globalHealth.summary.critical_offline}`,
      data: {
        global_status: globalHealth.status,
        summary: globalHealth.summary as unknown as JsonObject,
      },
    }),
    makeCheck({
      id: "required-routes",
      label: "Rutas operativas",
      status: missingRoutes.length === 0 ? "ready" : "blocked",
      ok: missingRoutes.length === 0,
      critical: true,
      detail: missingRoutes.length === 0 ? "Todas las rutas críticas existen." : `Rutas faltantes: ${missingRoutes.join(", ")}`,
      data: {
        required_routes: requiredRoutes,
        missing_routes: missingRoutes,
      },
    }),
    makeCheck({
      id: "launch-docs",
      label: "Documentación de lanzamiento",
      status: missingDocs.length === 0 ? "ready" : "warning",
      ok: missingDocs.length === 0,
      critical: false,
      detail: missingDocs.length === 0 ? "Launch Checklist, Operator Manual e Integration Contract disponibles." : `Docs faltantes: ${missingDocs.join(", ")}`,
      data: {
        required_docs: docs,
        missing_docs: missingDocs,
      },
    }),
    makeCheck({
      id: "access-policy",
      label: "Access Policy",
      status: rolesWithRealExecution.length === 0 && HOCKER_GLOBAL_REAL_EXECUTION_LOCK ? "ready" : "blocked",
      ok: rolesWithRealExecution.length === 0 && HOCKER_GLOBAL_REAL_EXECUTION_LOCK,
      critical: true,
      detail: `Roles=${HOCKER_ROLE_DEFINITIONS.length}; execution_lock=${HOCKER_GLOBAL_REAL_EXECUTION_LOCK}`,
      data: {
        roles: HOCKER_ROLE_DEFINITIONS.map((role) => role.role),
        roles_with_real_execution: rolesWithRealExecution.map((role) => role.role),
        execution_lock: HOCKER_GLOBAL_REAL_EXECUTION_LOCK,
      },
    }),
    makeCheck({
      id: "integration-registry",
      label: "Integration Registry",
      status: chido ? "ready" : "blocked",
      ok: Boolean(chido),
      critical: true,
      detail: chido ? "Chido Casino registrado como módulo canónico." : "Chido Casino no encontrado en integraciones canónicas.",
      data: {
        module_id: chido?.module_id ?? null,
        actions_mode: chido?.actions_mode ?? null,
        real_execution_enabled: chido?.real_execution_enabled ?? null,
        execution_lock: chido?.execution_lock ?? null,
      },
    }),
    makeCheck({
      id: "chido-safety-mode",
      label: "Chido Safety Mode",
      status: chido && chido.actions_mode === "preflight_locked" && chido.real_execution_enabled === false && chido.execution_lock === true ? "ready" : "blocked",
      ok: Boolean(chido && chido.actions_mode === "preflight_locked" && chido.real_execution_enabled === false && chido.execution_lock === true),
      critical: true,
      detail: chido ? `actions_mode=${chido.actions_mode}; real_execution_enabled=${chido.real_execution_enabled}; execution_lock=${chido.execution_lock}` : "Chido no disponible.",
      data: {
        actions_mode: chido?.actions_mode ?? null,
        real_execution_enabled: chido?.real_execution_enabled ?? null,
        execution_lock: chido?.execution_lock ?? null,
      },
    }),
    makeCheck({
      id: "syntia-memory",
      label: "SYNTIA Memory",
      status: memoryItems > 0 ? "ready" : "warning",
      ok: memoryItems > 0,
      critical: false,
      detail: memoryItems > 0 ? `${memoryItems} memorias recientes disponibles.` : "Sin memoria reciente.",
      data: {
        recent_memory_items: memoryItems,
      },
    }),
  ];

  const summary = summarize(checks);
  const status = overallStatus(summary);

  const result: BetaReadinessResult = {
    ok: status !== "blocked",
    status,
    version: HOCKER_BETA_READINESS_VERSION,
    checked_at: new Date().toISOString(),
    summary,
    checks,
  };

  if (args?.emitEvent !== false) {
    try {
      const sb = createAdminSupabase();

      const { data } = await sb
        .from("events")
        .insert({
          project_id: "hocker-one",
          level: status === "ready" ? "info" : status === "warning" ? "warn" : "error",
          type: HOCKER_BETA_READINESS_EVENT,
          message: `Beta Readiness ejecutado: ${status}`,
          data: result as unknown as JsonObject,
        })
        .select("id")
        .single();

      return {
        ...result,
        event_id: data?.id,
      };
    } catch {
      return result;
    }
  }

  return result;
}
