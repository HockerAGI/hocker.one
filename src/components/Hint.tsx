"use client";

import React from "react";
import { useWorkspace } from "@/components/WorkspaceContext";

export default function Hint({ title, children }: { title: string; children: React.ReactNode }) {
  const { tutorial } = useWorkspace();
  if (!tutorial) return null;

  return (
    <div className="rounded-3xl border border-sky-200 bg-gradient-to-r from-sky-50 to-blue-50 px-4 py-3 text-sm text-sky-950 shadow-sm">
      <div className="font-extrabold tracking-tight">{title}</div>
      <div className="mt-1 leading-6 text-sky-900/90">{children}</div>
    </div>
  );
}