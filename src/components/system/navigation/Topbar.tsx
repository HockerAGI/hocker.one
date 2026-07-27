import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = {
  title?: string;
  left?: ReactNode;
  right?: ReactNode;
  className?: string;
};

export function Topbar({
  title,
  left,
  right,
  className,
}: Props) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/10 bg-[#08111d]/80 px-6 backdrop-blur-xl",
        className,
      )}
    >
      <div className="flex items-center gap-4">
        {left}
        {title && (
          <span className="font-medium text-white">
            {title}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {right}
      </div>
    </header>
  );
}
