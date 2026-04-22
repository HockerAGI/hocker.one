import { AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/cn";

type HintProps = {
  title: string;
  children: React.ReactNode;
  tone?: "sky" | "rose";
};

export default function Hint({ title, children, tone = "sky" }: HintProps) {
  const danger = tone === "rose";

  return (
    <div
      className={cn(
        "rounded-[24px] border px-4 py-4",
        danger
          ? "border-rose-400/15 bg-rose-400/8"
          : "border-sky-400/15 bg-sky-400/8",
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-0.5 flex h-9 w-9 items-center justify-center rounded-2xl border",
            danger
              ? "border-rose-400/15 bg-rose-400/10 text-rose-300"
              : "border-sky-400/15 bg-sky-400/10 text-sky-300",
          )}
        >
          {danger ? <AlertTriangle className="h-4.5 w-4.5" /> : <Info className="h-4.5 w-4.5" />}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-bold text-white">{title}</p>
          <div className="mt-1 text-sm leading-relaxed text-slate-300">{children}</div>
        </div>
      </div>
    </div>
  );
}
