import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";

type SurfaceVariant = "default" | "glass" | "muted" | "accent";

type SurfaceProps<T extends ElementType> = {
  as?: T;
  variant?: SurfaceVariant;
  interactive?: boolean;
  elevated?: boolean;
  className?: string;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

function variantClasses(variant: SurfaceVariant): string {
  switch (variant) {
    case "glass":
      return "border-white/10 bg-[linear-gradient(180deg,rgba(9,14,26,0.92)_0%,rgba(6,10,18,0.74)_100%)] backdrop-blur-2xl";
    case "muted":
      return "border-white/8 bg-white/[0.03]";
    case "accent":
      return "border-cyan-300/20 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.14),rgba(6,10,18,0.84)_55%)]";
    default:
      return "border-white/10 bg-[linear-gradient(180deg,rgba(10,16,30,0.9)_0%,rgba(6,10,18,0.82)_100%)]";
  }
}

export function Surface<T extends ElementType = "div">({
  as,
  variant = "default",
  interactive = false,
  elevated = true,
  className,
  children,
  ...rest
}: SurfaceProps<T>) {
  const Component = as ?? "div";

  return (
    <Component
      {...rest}
      className={cn(
        "relative overflow-hidden rounded-[28px] border transition duration-300",
        "shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_28px_80px_rgba(0,0,0,0.28)]",
        variantClasses(variant),
        elevated && "shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_28px_80px_rgba(0,0,0,0.28)]",
        interactive &&
          "group hover:-translate-y-0.5 hover:border-cyan-300/25 hover:shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_34px_95px_rgba(0,0,0,0.34)]",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,transparent_24%,transparent_100%)] opacity-75"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/5"
      />
      <div className="relative z-10">{children}</div>
    </Component>
  );
}
