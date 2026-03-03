"use client";

import React from "react";
import { useWorkspace } from "@/components/WorkspaceContext";

export default function Hint({ title, children }: { title: string; children: React.ReactNode }) {
  const { tutorial } = useWorkspace();
  if (!tutorial) return null;

  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-slate-700">
      <div className="text-xs font-extrabold tracking-wide text-blue-800">{title}</div>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}