import { createServerSupabase } from "./supabase-server";
import { normalizeProjectId, defaultProjectId } from "./project";

export type AuthzOk = {
  ok: true;
  user: { id: string; email?: string | null };
  project_id: string;
  role: "owner" | "admin" | "operator";
};

export type AuthzFail = { ok: false; status: number; error: string };

export type AuthzResult = AuthzOk | AuthzFail;

export async function requireRole(
  allowedRoles: Array<"owner" | "admin" | "operator">,
  projectId?: string | null
): Promise<AuthzResult> {
  const supabase = createServerSupabase();

  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return { ok: false, status: 401, error: "No autorizado" };

  const project_id = normalizeProjectId(projectId ?? defaultProjectId());

  const { data: membership, error } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", project_id)
    .eq("user_id", u.user.id)
    .single();

  if (error || !membership?.role) return { ok: false, status: 403, error: "Sin acceso a este proyecto" };

  const role = membership.role as AuthzOk["role"];
  if (!allowedRoles.includes(role)) return { ok: false, status: 403, error: "Permisos insuficientes" };

  return {
    ok: true,
    user: { id: u.user.id, email: u.user.email },
    project_id,
    role
  };
}