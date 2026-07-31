import "server-only";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";

export const HOCKER_PRIVATE_SESSION_GUARD_VERSION = "hocker-private-session-guard-v0.2.0";

const PRIVATE_ROLES = new Set(["owner", "admin", "operator"]);

export async function requirePrivateSession(projectId = "hocker-one") {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  if (!url || !anon) {
    redirect("/login");
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", data.user.id)
    .maybeSingle();

  const role = String(membership?.role ?? "").trim().toLowerCase();
  if (membershipError || !PRIVATE_ROLES.has(role)) {
    redirect("/login?reason=forbidden");
  }

  return data.user;
}
