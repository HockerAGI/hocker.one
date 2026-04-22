"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import BottomDock from "@/components/BottomDock";
import WorkspaceBar from "@/components/WorkspaceBar";

const PUBLIC_ROUTES = ["/", "/login", "/auth/callback"];

export default function ShellFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-[100dvh] w-full bg-[#08111f] text-slate-50">
      <Sidebar />

      <div className="min-h-[100dvh] lg:pl-[304px]">
        <Topbar />

        <main className="px-3 pb-28 pt-[90px] sm:px-4 lg:px-6 lg:pb-8 lg:pt-[104px]">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
            <WorkspaceBar />
            {children}
          </div>
        </main>
      </div>

      <BottomDock />
    </div>
  );
}