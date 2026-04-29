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

  if (isPublicRoute) return <>{children}</>;

  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col overflow-x-hidden bg-[#030711] text-slate-50">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_10%_10%,rgba(85,220,255,0.10),transparent_26%),radial-gradient(circle_at_88%_12%,rgba(139,92,246,0.08),transparent_24%),linear-gradient(180deg,#030711_0%,#050b18_100%)]" />

      <Sidebar />

      <div className="relative flex min-h-[100dvh] w-full flex-col lg:pl-[290px]">
        <Topbar />

        <main className="relative mx-auto flex w-full flex-1 flex-col px-3 pb-32 pt-[96px] sm:px-4 lg:px-5 lg:pb-8">
          <div className="mx-auto mb-4 w-full max-w-[1800px]">
            <WorkspaceBar />
          </div>

          <div className="mx-auto flex w-full max-w-[1800px] flex-1 flex-col">
            {children}
          </div>
        </main>
      </div>

      <BottomDock />
    </div>
  );
}
