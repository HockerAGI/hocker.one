"use client";

import React from "react";
import { useWorkspace } from "@/components/WorkspaceContext";

export default function Hint({ title, children }: { title: string; children: React.ReactNode }) {
  const { tutorial } = useWorkspace();
  if (!tutorial) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-sky-400/20 bg-gradient-to-br from-sky-500/10 to-slate-900/60 p-5 shadow-sm backdrop-blur-xl">
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-sky-400/10 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative flex items-start gap-4">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-sky-400/20 bg-sky-500/10 text-sky-300">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
          </svg>
        </div>
        <div>
          <h4 className="text-[15px] font-extrabold tracking-tight text-white">{title}</h4>
          <div className="mt-1.5 text-[14px] leading-relaxed text-slate-300">{children}</div>
        </div>
      </div>
    </div>
  );
}