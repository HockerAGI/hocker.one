import { createServerSupabase } from "./supabase-server";

export async function requireRole(allowed: Array<"owner" | "admin">) {
  const sb = createServerSupabase();
  const { data } = await sb.auth.getUser();
  if (!data.user) return { ok: false as const, status: 401, error: "No autorizado", user: null, role: null };

  const { data: profile } = await sb.from("profiles").select("role").eq("id", data.user.id).single();
  const role = (profile?.role ?? "operator") as any;

  if (!allowed.includes(role)) {
    return { ok: false as const, status: 403, error: "Permisos insuficientes", user: data.user, role };
  }

  return { ok: true as const, status: 200, error: null, user: data.user, role };
}