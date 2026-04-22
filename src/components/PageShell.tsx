"use client";

import type { ReactNode } from "react";
import WorkspaceBar from "@/components/WorkspaceBar";
import { useWorkspace } from "@/components/WorkspaceContext";
import { cn } from "@/lib/cn";

type PageShellProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  subtitle?: string;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  compact?: boolean;
  showWorkspaceBar?: boolean;
};

export default function PageShell({
  eyebrow,
  title,
  description,
  subtitle,
  actions,
  children,
  className = "",
  compact = false,
  showWorkspaceBar = false,
}: PageShellProps) {
  const { ready, projectId, nodeId } = useWorkspace();
  const body = description ?? subtitle;

  return (
    <section
      className={cn(
        "mx-auto w-full max-w-7xl",
        className,
      )}
    >
      <div className="shell-panel-strong surface-grid relative overflow-hidden p-5 sm:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.08),transparent_30%)]" />
        <div className="relative flex flex-col gap-5">
          <div className={compact ? "space-y-3" : "space-y-4"}>
            {eyebrow ? <p className="section-kicker">{eyebrow}</p> : null}

            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <h1 className="h1-title">{title}</h1>

                {body ? (
                  <p className="section-copy max-w-2xl">
                    {body}
                  </p>
                ) : null}

                {ready ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="shell-chip-brand">{projectId}</span>
                    <span className="shell-chip">{nodeId}</span>
                  </div>
                ) : null}
              </div>

              {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
            </div>
          </div>

          {showWorkspaceBar ? <WorkspaceBar /> : null}

          <div>{children}</div>
        </div>
      </div>
    </section>
  );
}
