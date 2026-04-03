"use client";

import CommandBox from "@/components/CommandBox";
import { useWorkspace } from "@/components/WorkspaceContext";

export default function CommandBoxClient() {
  const { projectId, nodeId } = useWorkspace();

  return <CommandBox projectId={projectId} nodeId={nodeId} />;
}