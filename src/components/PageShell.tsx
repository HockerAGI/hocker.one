"use client";

import type { ReactNode } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import BottomDock from "@/components/BottomDock";
import WorkspaceBar from "@/components/WorkspaceBar";
import { cn } from "@/lib/cn";

type PageShellProps = {
  children: ReactNode;
  className?: string;
  showWorkspaceBar?: boolean;
};

export default function PageShell({
  children,
  className = "",
  showWorkspaceBar = true,
}: PageShellProps) {
  return (
    <div className="min-h-screen bg-[#020617] text-slate-50">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-12rem] top-[-10rem] h-[28rem] w-[28rem] rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute right-[-8rem] top-[12rem] h-[24rem] w-[24rem] rounded-full bg-violet-500/8 blur-3xl" />
        <div className="absolute bottom-[-10rem] left-[30%] h-[20rem] w-[20rem] rounded-full bg-cyan-400/8 blur-3xl" />
      </div>

      <Sidebar />

      <div className="relative min-h-screen lg:pl-[292px]">
        <Topbar />

        <main
          className={cn(
            "relative mx-auto flex min-h-screen w-full flex-col px-3 pb-28 pt-[94px] sm:px-4 lg:px-5 lg:pb-8",
            className,
          )}
        >
          {showWorkspaceBar ? (
            <div className="mx-auto w-full max-w-7xl">
              <WorkspaceBar className="mb-4" />
            </div>
          ) : null}

          <div className="mx-auto w-full max-w-7xl flex-1">
            {children}
          </div>
        </main>
      </div>

      <BottomDock />
    </div>
  );
}