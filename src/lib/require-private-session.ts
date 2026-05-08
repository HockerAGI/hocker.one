import "server-only";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";

export const HOCKER_PRIVATE_SESSION_GUARD_VERSION = "hocker-private-session-guard-v0.1.0";

export async function requirePrivateSession() {
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

  return data.user;
}
