"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { defaultNodeId, defaultProjectId, type NodeId, type ProjectId } from "@/lib/project";

type WorkspaceContextValue = {
  projectId: ProjectId;
  nodeId: NodeId;
  tutorial: boolean;
  ready: boolean;
  setProjectId: (value: ProjectId) => void;
  setNodeId: (value: NodeId) => void;
  setTutorial: (value: boolean) => void;
  toggleTutorial: () => void;
  resetWorkspace: () => void;
};

const STORAGE_KEYS = {
  projectId: "hocker.workspace.projectId",
  nodeId: "hocker.workspace.nodeId",
  tutorial: "hocker.workspace.tutorial",
} as const;

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);

function readBoolean(value: string | null, fallback: boolean): boolean {
  if (value === null) return fallback;
  return value === "true" || value === "1";
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [projectId, setProjectIdState] = useState<ProjectId>(defaultProjectId);
  const [nodeId, setNodeIdState] = useState<NodeId>(defaultNodeId);
  const [tutorial, setTutorialState] = useState(false);

  useEffect(() => {
    const storedProjectId = window.localStorage.getItem(STORAGE_KEYS.projectId);
    const storedNodeId = window.localStorage.getItem(STORAGE_KEYS.nodeId);
    const storedTutorial = window.localStorage.getItem(STORAGE_KEYS.tutorial);

    setProjectIdState((storedProjectId as ProjectId) || defaultProjectId);
    setNodeIdState((storedNodeId as NodeId) || defaultNodeId);
    setTutorialState(readBoolean(storedTutorial, false));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEYS.projectId, projectId);
  }, [projectId, ready]);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEYS.nodeId, nodeId);
  }, [nodeId, ready]);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEYS.tutorial, tutorial ? "true" : "false");
  }, [tutorial, ready]);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      projectId,
      nodeId,
      tutorial,
      ready,
      setProjectId: setProjectIdState,
      setNodeId: setNodeIdState,
      setTutorial: setTutorialState,
      toggleTutorial: () => setTutorialState((prev) => !prev),
      resetWorkspace: () => {
        setProjectIdState(defaultProjectId);
        setNodeIdState(defaultNodeId);
        setTutorialState(false);
        window.localStorage.removeItem(STORAGE_KEYS.projectId);
        window.localStorage.removeItem(STORAGE_KEYS.nodeId);
        window.localStorage.removeItem(STORAGE_KEYS.tutorial);
      },
    }),
    [projectId, nodeId, tutorial, ready],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace debe usarse dentro de WorkspaceProvider.");
  }
  return context;
}