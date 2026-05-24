import { NextRequest, NextResponse } from "next/server";
import {
  HOCKER_PRIVATE_TOPOLOGY_HEADER,
  HOCKER_PUBLIC_TOPOLOGY_HEADER,
  isHockerNoindexRoute,
  isHockerPublicRoute,
} from "@/lib/hocker-public-private-topology";

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const pathname = req.nextUrl.pathname;

  const mustNoindex = isHockerNoindexRoute(pathname) || !isHockerPublicRoute(pathname);

  if (mustNoindex) {
    res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    res.headers.set("X-Hocker-Topology", HOCKER_PRIVATE_TOPOLOGY_HEADER);
  } else {
    res.headers.set("X-Hocker-Topology", HOCKER_PUBLIC_TOPOLOGY_HEADER);
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|brand/|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|css|js|map|txt|xml|webmanifest)$).*)",
  ],
};
