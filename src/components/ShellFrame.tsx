"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import BottomDock from "@/components/BottomDock";
import WorkspaceBar from "@/components/WorkspaceBar";
import HockerLiveBackground from "@/components/ui-hocker/HockerLiveBackground";
import HockerVfxLayer from "@/components/vfx/HockerVfxLayer";

const PUBLIC_ROUTES = ["/", "/empresa", "/login", "/auth/callback"];

export default function ShellFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (isPublicRoute) return <>{children}</>;

  return (
    <div className="hko-cinematic-root relative flex min-h-[100dvh] w-full flex-col overflow-x-hidden bg-[#030711] text-slate-50">
      <HockerLiveBackground />
      <HockerVfxLayer />
      <Sidebar />

      <div className="relative flex min-h-[100dvh] w-full flex-col lg:pl-[290px]">
        <Topbar />

        <main className="hko-shell-main relative mx-auto flex w-full flex-1 flex-col px-3 pb-[calc(env(safe-area-inset-bottom)+11rem)] pt-4 sm:px-4 lg:px-5 lg:pb-8 lg:pt-[96px]">
          <div className="mx-auto mb-4 hidden w-full max-w-[1800px] lg:block">
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
