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

  if (!url || !anon) return NextResponse.next();

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

  if (error && isProtected(pathname)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname.startsWith("/login") && data.user) {
    return NextResponse.redirect(new URL("/owner", req.url));
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
    "/servicios/:path*",
    "/apps/:path*",
    "/supply/:path*",
    "/governance/:path*",
    "/memory/:path*",
    "/status/:path*",
    "/integrations/:path*",
    "/access/:path*",
    "/launch/:path*",
    "/mobile/:path*",
    "/security/:path*",
    "/owner/:path*",
    "/chido/:path*",
    "/admin/:path*",
  ],
};
