"use client";

import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import BottomDock from "@/components/BottomDock";
import CommandPalette from "@/components/CommandPalette";
import SignalBackdrop from "@/components/signal/SignalBackdrop";

export default function PrivateShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-[100dvh] w-full flex-col overflow-x-hidden bg-[#030711] text-slate-50">
      <SignalBackdrop />
      <Sidebar />

      <div className="relative z-10 flex min-h-[100dvh] w-full flex-col lg:pl-[264px]">
        <Topbar />

        <main
          className="relative mx-auto flex w-full flex-1 flex-col px-3 pb-[var(--hko-mobile-dock-reserve)] pt-[76px] sm:px-5 md:pb-8 lg:pt-[72px]"
          id="main-content"
        >
          <div className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col">
            {children}
          </div>
        </main>
      </div>

      <BottomDock />
      <CommandPalette />
    </div>
  );
}
