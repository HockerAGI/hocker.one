"use client";

import type { ReactNode } from "react";
import WorkspaceBar from "@/components/WorkspaceBar";

type PageShellProps = {
  eyebrow?: string;
  title: string;
  description?: string;
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
  actions,
  children,
  className = "",
  compact = false,
  showWorkspaceBar = true,
}: PageShellProps) {
  return (
    <section className={["mx-auto w-full max-w-[1800px] px-4 py-5 sm:px-6 lg:px-8 lg:py-6", className].join(" ")}>
      <div className="hocker-panel-strong overflow-hidden border-sky-400/10 p-5 sm:p-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.08),transparent_30%)]" />
        <div className="relative flex flex-col gap-5">
          <div className={compact ? "space-y-3" : "space-y-4"}>
            {eyebrow ? (
              <p className="hocker-title-line">{eyebrow}</p>
            ) : null}

            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                  {title}
                </h1>
                {description ? (
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
                    {description}
                  </p>
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
