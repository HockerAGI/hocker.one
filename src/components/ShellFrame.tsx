"use client";

import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { HOCKER_PUBLIC_ROUTES } from "@/lib/hocker-public-private-topology";

// The whole private shell (sidebar, topbar, dock, background, VFX) is code-split
// into its own chunk so the public/marketing routes never download it.
const PrivateShell = dynamic(() => import("@/components/PrivateShell"));

export default function ShellFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const isPublicRoute = HOCKER_PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (isPublicRoute) return <>{children}</>;

  return <PrivateShell>{children}</PrivateShell>;
}
