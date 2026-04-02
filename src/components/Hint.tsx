"use client";

import { ReactNode } from "react";
import { useWorkspace } from "@/components/WorkspaceContext";

type HintProps = {
  title: string;
  children: ReactNode;
};

export default function Hint({ title, children }: HintProps) {
  const { tutorial } = useWorkspace();

  if (!tutorial) return null;

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-sky-400/20 bg-gradient-to-br from-sky-500/10 to-slate-900/80 p-6 shadow-lg backdrop-blur-2xl transition-all hover:border-sky-400/30">
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-sky-400/10 blur-3xl animate-pulse"
        aria-hidden="true"
      />
      <div className="relative flex items-start gap-4">
        <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-sky-400/20 bg-sky-500/10 text-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.2)]">
          <svg
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <div className="flex-1">
          <h4 className="mb-1 text-[11px] font-black uppercase tracking-[0.2em] text-sky-400">
            {title}
          </h4>
          <div className="text-[13px] font-medium leading-relaxed text-slate-300">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}