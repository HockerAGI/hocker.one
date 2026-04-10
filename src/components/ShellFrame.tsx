"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import BottomDock from "@/components/BottomDock";

const PUBLIC_ROUTES = ["/", "/login", "/auth/callback"];

export default function ShellFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar />
      <Topbar />

      <div className="relative z-10 min-h-screen lg:pl-[284px]">
        <div className="min-h-screen pt-[78px] pb-[92px] lg:pb-0">
          {children}
        </div>
      </div>

      <BottomDock />
    </>
  );
}
