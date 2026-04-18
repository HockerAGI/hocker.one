"use client";

import type { ReactNode } from "react";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import BottomDock from "@/components/BottomDock";
import WorkspaceBar from "@/components/WorkspaceBar";
import { cn } from "@/lib/cn";

export type PageShellProps = {
  children: ReactNode;
  className?: string;
  showSidebar?: boolean;
  showTopbar?: boolean;
  showBottomDock?: boolean;
  showWorkspaceBar?: boolean;
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
};

export default function PageShell({
  children,
  className,
  showSidebar = true,
  showTopbar = true,
  showBottomDock = true,
  showWorkspaceBar = false,
  title,
  subtitle,
  actions,
}: PageShellProps) {
  return (
    <div className="flex h-screen w-full bg-hocker-black text-hocker-light overflow-hidden">
      {showSidebar && <Sidebar />}
      
      <div className="flex flex-col flex-1 relative overflow-hidden">
        {showTopbar && <Topbar />}
        {showWorkspaceBar && <WorkspaceBar />}
        
        <main className={cn("flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6 scrollbar-hocker", className)}>
          {/* Motor de renderizado dinámico para las cabeceras */}
          {(title || subtitle || actions) && (
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                {title && <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">{title}</h1>}
                {subtitle && <p className="text-hocker-dim mt-1">{subtitle}</p>}
              </div>
              {actions && <div className="flex items-center gap-3">{actions}</div>}
            </div>
          )}
          {children}
        </main>

        {showBottomDock && <BottomDock />}
      </div>
    </div>
  );
}