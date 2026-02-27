"use client";

import React from "react";
import { useWorkspace } from "@/components/WorkspaceContext";

export default function Hint({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { tutorial } = useWorkspace();
  if (!tutorial) return null;

  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
      <div className="font-bold">{title}</div>
      <div className="mt-1 text-blue-800">{children}</div>
    </div>
  );
}
