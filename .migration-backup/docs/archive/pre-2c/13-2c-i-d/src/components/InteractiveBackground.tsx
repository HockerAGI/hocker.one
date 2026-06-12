import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type InteractiveBackgroundProps = HTMLAttributes<HTMLDivElement>;

/**
 * Fondo visual seguro para Android/WebView.
 * No usa blur, filtros, motion, canvas, ruido, overlays animados ni composición pesada.
 */
export default function InteractiveBackground({
  className,
  ...props
}: InteractiveBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 -z-10 bg-[#030711]",
        className,
      )}
      {...props}
    />
  );
}
