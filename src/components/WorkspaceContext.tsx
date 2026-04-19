"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { NodeId, ProjectId } from "@/lib/project";

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

const DEFAULT_PROJECT_ID = "hocker-one" as ProjectId;
const DEFAULT_NODE_ID = "hocker-agi" as NodeId;

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

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [projectId, setProjectIdState] = useState<ProjectId>(DEFAULT_PROJECT_ID);
  const [nodeId, setNodeIdState] = useState<NodeId>(DEFAULT_NODE_ID);
  const [tutorial, setTutorialState] = useState(false);

  useEffect(() => {
    const storage = getStorage();

    if (!storage) {
      setReady(true);
      return;
    }

    const storedProjectId = storage.getItem(STORAGE_KEYS.projectId);
    const storedNodeId = storage.getItem(STORAGE_KEYS.nodeId);
    const storedTutorial = storage.getItem(STORAGE_KEYS.tutorial);

    setProjectIdState((storedProjectId as ProjectId) || DEFAULT_PROJECT_ID);
    setNodeIdState((storedNodeId as NodeId) || DEFAULT_NODE_ID);
    setTutorialState(readBoolean(storedTutorial, false));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const storage = getStorage();
    if (!storage) return;
    storage.setItem(STORAGE_KEYS.projectId, projectId);
  }, [projectId, ready]);

  useEffect(() => {
    if (!ready) return;
    const storage = getStorage();
    if (!storage) return;
    storage.setItem(STORAGE_KEYS.nodeId, nodeId);
  }, [nodeId, ready]);

  useEffect(() => {
    if (!ready) return;
    const storage = getStorage();
    if (!storage) return;
    storage.setItem(STORAGE_KEYS.tutorial, tutorial ? "true" : "false");
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
        const storage = getStorage();
        setProjectIdState(DEFAULT_PROJECT_ID);
        setNodeIdState(DEFAULT_NODE_ID);
        setTutorialState(false);

        if (!storage) return;
        storage.removeItem(STORAGE_KEYS.projectId);
        storage.removeItem(STORAGE_KEYS.nodeId);
        storage.removeItem(STORAGE_KEYS.tutorial);
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