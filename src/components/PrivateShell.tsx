"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import BottomDock from "@/components/BottomDock";
import CommandPalette from "@/components/CommandPalette";
import HockerLiveBackground from "@/components/ui-hocker/HockerLiveBackground";

const HockerVfxLayer = dynamic(() => import("@/components/vfx/HockerVfxLayer"), { ssr: false });

export default function PrivateShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/owner";
  const immersive = pathname === "/chat";

  return (
    <div className="hko-cinematic-root relative flex min-h-[100dvh] w-full flex-col overflow-x-hidden bg-[#030711] text-slate-50">
      <HockerLiveBackground />
      <HockerVfxLayer />
      {immersive ? null : <Sidebar />}

      <div className={["relative flex min-h-[100dvh] w-full flex-col", immersive ? "" : "lg:pl-[288px]"].join(" ")}>
        {immersive ? null : <Topbar />}
        <main
          className={immersive
            ? "relative flex min-h-[100dvh] w-full flex-1 flex-col"
            : "hko-shell-main hko-mobile-dock-reserve relative mx-auto flex w-full flex-1 flex-col px-3 pb-[calc(env(safe-area-inset-bottom)+8.5rem)] pt-[76px] sm:px-5 lg:pb-8 lg:pt-[72px]"}
          id="main-content"
        >
          <div className={immersive ? "flex min-h-0 w-full flex-1 flex-col" : "mx-auto flex w-full max-w-[1800px] flex-1 flex-col"}>{children}</div>
        </main>
      </div>

      {immersive ? null : <BottomDock />}
      <CommandPalette />
    </div>
  );
}
