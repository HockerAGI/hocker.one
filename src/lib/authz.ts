// src/lib/authz.ts
import { createServerSupabase } from "@/lib/supabase-server";
import { normalizeProjectId } from "@/lib/project";

export type AppRole = "owner" | "admin" | "operator" | "viewer";

export async function getUser() {
  const supabase = createServerSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

export async function getGlobalRole(userId: string): Promise<AppRole> {
  const supabase = createServerSupabase();
  const { data } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  const role = String(data?.role ?? "operator") as AppRole;
  return role;
}

export async function getProjectRole(userId: string, projectId: string): Promise<AppRole> {
  const supabase = createServerSupabase();
  const pid = normalizeProjectId(projectId);

  // Si es owner/admin global, ya ganó
  const globalRole = await getGlobalRole(userId);
  if (globalRole === "owner" || globalRole === "admin") return globalRole;

  const { data } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", pid)
    .eq("user_id", userId)
    .maybeSingle();

  return (String(data?.role ?? "viewer") as AppRole) ?? "viewer";
}

export async function requireRole(roles: AppRole[]) {
  const user = await getUser();
  if (!user) return { ok: false, status: 401, error: "No autorizado", user: null as any };

  const role = await getGlobalRole(user.id);
  if (!roles.includes(role)) return { ok: false, status: 403, error: "Sin permiso", user: null as any };

  return { ok: true, status: 200, error: null, user };
}

export async function requireProjectRole(projectId: string, roles: AppRole[]) {
  const user = await getUser();
  if (!user) return { ok: false, status: 401, error: "No autorizado", user: null as any };

  const role = await getProjectRole(user.id, projectId);
  if (!roles.includes(role)) return { ok: false, status: 403, error: "Sin permiso en este proyecto", user: null as any };

  return { ok: true, status: 200, error: null, user, role };
}