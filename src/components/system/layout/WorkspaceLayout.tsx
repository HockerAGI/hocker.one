import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Surface } from "../surfaces";

type WorkspaceLayoutProps = {
  topbar?: ReactNode;
  sidebar?: ReactNode;
  rightRail?: ReactNode;
  composer?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
  sidebarClassName?: string;
  rightRailClassName?: string;
  composerClassName?: string;
  maxWidth?: "6xl" | "7xl" | "full";
};

function maxWidthClass(maxWidth: WorkspaceLayoutProps["maxWidth"]) {
  switch (maxWidth) {
    case "6xl":
      return "max-w-6xl";
    case "full":
      return "max-w-none";
    default:
      return "max-w-7xl";
  }
}

export function WorkspaceLayout({
  topbar,
  sidebar,
  rightRail,
  composer,
  children,
  footer,
  className,
  contentClassName,
  sidebarClassName,
  rightRailClassName,
  composerClassName,
  maxWidth = "7xl",
}: WorkspaceLayoutProps) {
  const hasLeftRail = Boolean(sidebar);
  const hasRightRail = Boolean(rightRail);

  return (
    <main className={cn("relative min-h-screen text-white", className)}>
      <div className={cn("mx-auto w-full px-4 py-4 sm:px-6 lg:px-8", maxWidthClass(maxWidth))}>
        {topbar ? (
          <div className="mb-4">
            <Surface variant="glass" className="p-0">
              <div className="p-4 md:p-5">{topbar}</div>
            </Surface>
          </div>
        ) : null}

        <div
          className={cn(
            "grid gap-4",
            hasLeftRail || hasRightRail ? "xl:grid-cols-[17rem_minmax(0,1fr)_19rem]" : "grid-cols-1",
          )}
        >
          {sidebar ? (
            <aside className={cn("hidden xl:block", sidebarClassName)}>
              <Surface variant="glass" className="sticky top-24 p-0">
                <div className="p-4 md:p-5">{sidebar}</div>
              </Surface>
            </aside>
          ) : null}

          <section className={cn("min-w-0", contentClassName)}>
            <Surface variant="glass" className="h-full p-0">
              <div className="p-4 md:p-6">{children}</div>
            </Surface>

            {composer ? (
              <div className={cn("mt-4", composerClassName)}>
                <Surface variant="glass" className="p-0">
                  <div className="p-4 md:p-5">{composer}</div>
                </Surface>
              </div>
            ) : null}
          </section>

          {rightRail ? (
            <aside className={cn("hidden xl:block", rightRailClassName)}>
              <Surface variant="glass" className="sticky top-24 p-0">
                <div className="p-4 md:p-5">{rightRail}</div>
              </Surface>
            </aside>
          ) : null}
        </div>

        {footer ? (
          <div className="mt-4">
            <Surface variant="muted" className="p-0">
              <div className="p-4 md:p-5">{footer}</div>
            </Surface>
          </div>
        ) : null}
      </div>
    </main>
  );
}
