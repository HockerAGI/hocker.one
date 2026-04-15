import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED_PATHS = [
  "/dashboard",
  "/chat",
  "/commands",
  "/nodes",
  "/agis",
  "/supply",
  "/governance",
];

function isProtected(pathname: string): boolean {
  return PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  if (!url || !anon) return NextResponse.next();

  // Clonamos la respuesta para sincronizar las cookies internamente y externamente
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          // 1. Sincronizamos para los Server Components
          req.cookies.set(name, value);
          // 2. Sincronizamos para el Cliente/Navegador
          res.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.getUser();

  if (error && isProtected(pathname)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname.startsWith("/login") && data.user) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (isProtected(pathname) && !data.user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return res;
}

export const config = {
  matcher: [
    "/login",
    "/dashboard/:path*",
    "/chat/:path*",
    "/commands/:path*",
    "/nodes/:path*",
    "/agis/:path*",
    "/supply/:path*",
    "/governance/:path*",
  ],
};