import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PREFIXES = [
  "/",
  "/one",
  "/empresa",
  "/servicios",
  "/ecosistema",
  "/soluciones",
  "/casos",
  "/seguridad",
  "/contacto",
  "/login",
  "/auth/callback",
];

const ALWAYS_PRIVATE_PREFIXES = [
  "/api",
  "/dashboard",
  "/chat",
  "/live",
  "/map",
  "/apps",
  "/agis",
  "/nodes",
  "/owner",
  "/commands",
  "/integrations",
  "/status",
  "/memory",
  "/governance",
  "/supply",
  "/mobile",
  "/launch",
  "/chido",
  "/security",
  "/admin",
  "/access",
];

function isExactOrChild(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

function isPrivatePath(pathname: string) {
  return ALWAYS_PRIVATE_PREFIXES.some((route) => isExactOrChild(pathname, route));
}

function isPublicPath(pathname: string) {
  return PUBLIC_PREFIXES.some((route) => isExactOrChild(pathname, route));
}

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const pathname = req.nextUrl.pathname;

  if (isPrivatePath(pathname) || !isPublicPath(pathname)) {
    res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }

  res.headers.set("X-Hocker-Topology", "12.7L-1-public-private-protected");

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|brand/|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|css|js|map|txt|xml|webmanifest)$).*)",
  ],
};
