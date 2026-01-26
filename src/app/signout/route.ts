import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const supabase = createServerSupabase();
  await supabase.auth.signOut();

  // Redirige al home del mismo dominio donde corre (local o Vercel)
  const url = new URL("/", request.url);
  return NextResponse.redirect(url);
}