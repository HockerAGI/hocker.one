import { createServerSupabase } from "@/lib/supabase-server";
import { normalizeProjectId } from "@/lib/project";

export type AppRole = "owner" | "admin" | "operator" | "viewer";

export async function requireProjectRole(projectId: string, roles: AppRole[]) {
  const supabase = createServerSupabase();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return { ok: false, status: 401, error: "No autorizado", user: null as any };

  const pid = normalizeProjectId(projectId);

  const { data: member } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", pid)
    .eq("user_id", user.id)
    .maybeSingle();

  const role = (String(member?.role ?? "viewer") as AppRole);

  if (!roles.includes(role)) return { ok: false, status: 403, error: "Sin permiso", user: null as any };
  return { ok: true, status: 200, error: null, user, role, project_id: pid };
}