"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type PageShellProps = {
  children: ReactNode;
  className?: string;
  // Mantenemos estas props en la interfaz para no romper páginas existentes,
  // pero la delegación global ahora es responsabilidad exclusiva de ShellFrame.
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
  title,
  subtitle,
  actions,
}: PageShellProps) {
  return (
    <div className={cn("flex flex-1 flex-col w-full animate-in fade-in duration-500", className)}>
      {/* Motor de renderizado dinámico para las cabeceras */}
      {(title || subtitle || actions) && (
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            {title && (
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-1 text-sm text-slate-400">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-3">
              {actions}
            </div>
          )}
        </div>
      )}
      
      <div className="flex flex-1 flex-col">
        {children}
      </div>
    </div>
  );
}