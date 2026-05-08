import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED_PATHS = [
  "/dashboard",
  "/chat",
  "/commands",
  "/nodes",
  "/agis",
  "/servicios",
  "/apps",
  "/supply",
  "/governance",
  "/memory",
  "/status",
  "/integrations",
  "/access",
  "/launch",
  "/mobile",
  "/security",
  "/owner",
  "/chido",
  "/admin",
];

function isProtected(pathname: string): boolean {
  return PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  const protectedRoute = isProtected(pathname);

  if (!url || !anon) {
    if (protectedRoute) return NextResponse.redirect(new URL("/login", req.url));
    return NextResponse.next();
  }

  const res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          req.cookies.set(name, value);
          res.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.getUser();

  if (error && protectedRoute) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname.startsWith("/login") && data.user) {
    return NextResponse.redirect(new URL("/owner", req.url));
  }

  if (protectedRoute && !data.user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return res;
}

export const config = {
  matcher: [
    "/login",
    "/dashboard",
    "/dashboard/:path*",
    "/chat",
    "/chat/:path*",
    "/commands",
    "/commands/:path*",
    "/nodes",
    "/nodes/:path*",
    "/agis",
    "/agis/:path*",
    "/servicios",
    "/servicios/:path*",
    "/apps",
    "/apps/:path*",
    "/supply",
    "/supply/:path*",
    "/governance",
    "/governance/:path*",
    "/memory",
    "/memory/:path*",
    "/status",
    "/status/:path*",
    "/integrations",
    "/integrations/:path*",
    "/access",
    "/access/:path*",
    "/launch",
    "/launch/:path*",
    "/mobile",
    "/mobile/:path*",
    "/security",
    "/security/:path*",
    "/owner",
    "/owner/:path*",
    "/chido",
    "/chido/:path*",
    "/admin",
    "/admin/:path*",
  ],
};
