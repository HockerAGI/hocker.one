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
    <section className={cn("hko-page-shell", className)}>
      <div className="hko-page-card">
        <header className={compact ? "hko-page-head is-compact" : "hko-page-head"}>
          <div className="hko-page-title-block">
            {eyebrow ? <p className="hko-page-eyebrow">{eyebrow}</p> : null}

            <h1>{title}</h1>

            {body ? <p>{body}</p> : null}

            {showWorkspaceBar && ready ? (
              <div className="hko-page-chips">
                <span>{projectId}</span>
                <span>{nodeId}</span>
              </div>
            ) : null}
          </div>

          {actions ? <div className="hko-page-actions">{actions}</div> : null}
        </header>

        {showWorkspaceBar ? <WorkspaceBar /> : null}

        <div className="hko-page-body">{children}</div>
      </div>
    </section>
  );
}
