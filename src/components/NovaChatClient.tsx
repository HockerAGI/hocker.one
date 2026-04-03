"use client";

import NovaChat from "@/components/NovaChat";
import { useWorkspace } from "@/components/WorkspaceContext";

export default function NovaChatClient() {
  const { projectId } = useWorkspace();

  return <NovaChat projectId={projectId} />;
}