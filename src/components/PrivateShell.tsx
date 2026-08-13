"use client";

import dynamic from "next/dynamic";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import BottomDock from "@/components/BottomDock";
import WorkspaceBar from "@/components/WorkspaceBar";
import CommandPalette from "@/components/CommandPalette";
import HockerLiveBackground from "@/components/ui-hocker/HockerLiveBackground";

// Decorative canvas: deferred so private content paints first.
const HockerVfxLayer = dynamic(() => import("@/components/vfx/HockerVfxLayer"), {
  ssr: false,
});

export default function PrivateShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="hko-cinematic-root relative flex min-h-[100dvh] w-full flex-col overflow-x-hidden bg-[#030711] text-slate-50">
      <HockerLiveBackground />
      <HockerVfxLayer />

      <Sidebar />

      <div className="relative flex min-h-[100dvh] w-full flex-col lg:pl-[288px]">
        <Topbar />

        <main
          className="hko-shell-main relative mx-auto flex w-full flex-1 flex-col px-3 pb-[calc(env(safe-area-inset-bottom)+8.5rem)] pt-[76px] sm:px-5 lg:pb-8 lg:pt-[72px]"
          id="main-content"
        >
          <div className="mx-auto mb-4 hidden w-full max-w-[1800px] lg:block">
            <WorkspaceBar />
          </div>

          <div className="mx-auto flex w-full max-w-[1800px] flex-1 flex-col">
            {children}
          </div>
        </main>
      </div>

      <BottomDock />
      <CommandPalette />
    </div>
  );
}
