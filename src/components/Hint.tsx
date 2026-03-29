"use client";

import React from "react";
import { useWorkspace } from "@/components/WorkspaceContext";

export default function Hint({ title, children }: { title: string; children: React.ReactNode }) {
  const { tutorial } = useWorkspace();
  if (!tutorial) return null;

  return (
    <div className="animate-in fade-in slide-in-from-top-2 duration-300 overflow-hidden relative rounded-3xl border border-blue-200/60 bg-gradient-to-br from-blue-50/80 to-sky-50/50 p-5 shadow-sm backdrop-blur-sm">
      <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-blue-400 opacity-10 blur-3xl pointer-events-none" aria-hidden="true" />
      
      <div className="relative flex items-start gap-4">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 border border-blue-200/50 text-blue-600 shadow-inner">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83" />
          </svg>
        </div>
        <div>
          <h4 className="text-[15px] font-extrabold tracking-tight text-slate-900">{title}</h4>
          <div className="mt-1.5 text-[14px] leading-relaxed text-slate-600">{children}</div>
        </div>
      </div>
    </div>
  );
}
