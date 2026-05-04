import { NextRequest, NextResponse } from "next/server";
import {
  HOCKER_ACCESS_POLICY_VERSION,
  HOCKER_GLOBAL_REAL_EXECUTION_LOCK,
  HOCKER_ROLE_DEFINITIONS,
  getDefaultHockerRole,
  getHockerRoleDefinition,
  normalizeHockerRole,
} from "@/lib/hocker-roles";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const roleFromQuery = url.searchParams.get("role");
  const roleFromHeader = req.headers.get("x-hocker-role");

  const role = normalizeHockerRole(roleFromQuery || roleFromHeader || getDefaultHockerRole());
  const definition = getHockerRoleDefinition(role);

  return NextResponse.json({
    ok: true,
    policy_version: HOCKER_ACCESS_POLICY_VERSION,
    role,
    profile: definition,
    roles: HOCKER_ROLE_DEFINITIONS,
    real_execution_enabled: false,
    execution_lock: HOCKER_GLOBAL_REAL_EXECUTION_LOCK,
    message: "Perfil de acceso calculado. La ejecución real permanece bloqueada.",
  });
}
