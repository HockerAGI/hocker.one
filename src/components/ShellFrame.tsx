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
    <div className="flex min-h-[100dvh] w-full flex-col bg-[#020617] text-slate-50">
      <Sidebar />

      <div className="relative flex min-h-[100dvh] w-full flex-col lg:pl-[292px]">
        <Topbar />

        <main className="relative mx-auto flex w-full flex-1 flex-col px-3 pb-28 pt-[94px] sm:px-4 lg:px-5 lg:pb-8">
          <div className="mx-auto w-full max-w-7xl">
            <WorkspaceBar className="mb-4" />
          </div>

          <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col">
            {children}
          </div>
        </main>
      </div>

      <BottomDock />
    </div>
  );
}