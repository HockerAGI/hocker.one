import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        get(name) {
          return request.cookies.get(name)?.value;
        },
        set(name, value, options) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name, options) {
          response.cookies.set({ name, value: "", ...options, maxAge: 0 });
        }
      }
    }
  );

  const { data } = await supabase.auth.getUser();
  const isAuthed = !!data.user;

  const protectedRoutes = ["/dashboard", "/chat", "/nodes", "/agis", "/supply", "/commands", "/governance"];
  const isProtected = protectedRoutes.some((p) => request.nextUrl.pathname.startsWith(p));

  if (isProtected && !isAuthed) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("auth", "required");
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/chat/:path*", "/nodes/:path*", "/agis/:path*", "/supply/:path*", "/commands/:path*", "/governance/:path*"]
};