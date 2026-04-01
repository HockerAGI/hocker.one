import { _getErrorMessage } from "@/lib/errors";
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

function safeNextPath(input: string | null): string {
  const fallback = "/dashboard";
  const raw = String(input ?? "").trim();
  if (!raw) return fallback;

  if (!raw.startsWith("/")) return fallback;
  if (raw.startsWith("//")) return fallback;
  if (raw.includes("\\")) return fallback;
  if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(raw)) return fallback;

  try {
    const parsed = new URL(raw, "https://hocker.local");
    if (parsed.origin !== "https://hocker.local") return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}` || fallback;
  } catch {
    return fallback;
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"));

  if (code) {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent("Llave de acceso inválida o expirada.")}`, url)
      );
    }
  }

  return NextResponse.redirect(new URL(next, req.url));
}
