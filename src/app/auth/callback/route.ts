import { getErrorMessage } from "@/lib/errors";
import { createServerSupabase } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

export async function GET(req: Request): Promise<NextResponse> {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"));

  try {
    if (code) {
      const supabase = await createServerSupabase();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        return NextResponse.redirect(
          new URL(
            `/?error=${encodeURIComponent("Llave de acceso inválida o expirada.")}`,
            url,
          ),
        );
      }
    }

    return NextResponse.redirect(new URL(next, req.url));
  } catch (err: unknown) {
    const message = getErrorMessage(err);
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(message)}`, url),
    );
  }
}