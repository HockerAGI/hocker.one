import { NextRequest, NextResponse } from "next/server";
import {
  HOCKER_PRIVATE_TOPOLOGY_HEADER,
  HOCKER_PUBLIC_TOPOLOGY_HEADER,
  isHockerNoindexRoute,
  isHockerPublicRoute,
} from "@/lib/hocker-public-private-topology";

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  if (
    pathname.startsWith("/_next") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const res = NextResponse.next();
  const isPublic = isHockerPublicRoute(pathname);

  if (isPublic) {
    res.headers.set(HOCKER_PUBLIC_TOPOLOGY_HEADER, "true");
  } else {
    res.headers.set(HOCKER_PRIVATE_TOPOLOGY_HEADER, "true");
  }

  if (isHockerNoindexRoute(pathname) || !isPublic) {
    res.headers.set("X-Robots-Tag", "noindex, nofollow, nosnippet");
  }

  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload",
  );

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
