"use client";

import type { ReactNode } from "react";
import WorkspaceBar from "@/components/WorkspaceBar";
import { useWorkspace } from "@/components/WorkspaceContext";
import { cn } from "@/lib/cn";
import { PageLayout } from "@/components/system";

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
    <PageLayout
      eyebrow={eyebrow}
      title={title}
      description={body}
      actions={actions}
      compact={compact}
      className={cn("hko-page-shell", className)}
      bodyClassName="space-y-4"
      footer={
        showWorkspaceBar && ready ? (
          <div className="flex flex-wrap gap-2 text-xs text-slate-300">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              {projectId}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
              {nodeId}
            </span>
          </div>
        ) : null
      }
    >
      {showWorkspaceBar ? <WorkspaceBar /> : null}
      <div className="hko-page-body">{children}</div>
    </PageLayout>
  );
}
