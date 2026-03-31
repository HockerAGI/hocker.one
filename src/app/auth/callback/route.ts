// ... (Mantén tu lógica de safeNextPath)

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
