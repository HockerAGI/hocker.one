"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type WorkspaceContextValue = {
  ready: boolean;
  projectId: string;
  nodeId: string;
  tutorial: boolean;
  setProjectId: (value: string) => void;
  setNodeId: (value: string) => void;
  setTutorial: (value: boolean) => void;
  toggleTutorial: () => void;
  resetWorkspace: () => void;
};

const DEFAULT_PROJECT_ID = "hocker-one";
const DEFAULT_NODE_ID = "hocker-node-1";
const STORAGE_KEY = "hocker.one.workspace.v1";

type WorkspaceStoredState = {
  projectId?: string;
  nodeId?: string;
  tutorial?: boolean;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

function normalizeProjectId(value: string): string {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 64);

  return normalized || DEFAULT_PROJECT_ID;
}

function normalizeNodeId(value: string): string {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 64);

  return normalized || DEFAULT_NODE_ID;
}

function readStoredState(): WorkspaceStoredState {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as WorkspaceStoredState;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStoredState(state: WorkspaceStoredState): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage errors
  }
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [projectId, setProjectIdState] = useState(DEFAULT_PROJECT_ID);
  const [nodeId, setNodeIdState] = useState(DEFAULT_NODE_ID);
  const [tutorial, setTutorialState] = useState(true);

  useEffect(() => {
    const stored = readStoredState();
    setProjectIdState(normalizeProjectId(stored.projectId ?? DEFAULT_PROJECT_ID));
    setNodeIdState(normalizeNodeId(stored.nodeId ?? DEFAULT_NODE_ID));
    setTutorialState(typeof stored.tutorial === "boolean" ? stored.tutorial : true);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    writeStoredState({ projectId, nodeId, tutorial });
  }, [ready, projectId, nodeId, tutorial]);

  const setProjectId = useCallback((value: string) => {
    setProjectIdState(normalizeProjectId(value));
  }, []);

  const setNodeId = useCallback((value: string) => {
    setNodeIdState(normalizeNodeId(value));
  }, []);

  const setTutorial = useCallback((value: boolean) => {
    setTutorialState(Boolean(value));
  }, []);

  const toggleTutorial = useCallback(() => {
    setTutorialState((current) => !current);
  }, []);

  const resetWorkspace = useCallback(() => {
    setProjectIdState(DEFAULT_PROJECT_ID);
    setNodeIdState(DEFAULT_NODE_ID);
    setTutorialState(true);
  }, []);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      ready,
      projectId,
      nodeId,
      tutorial,
      setProjectId,
      setNodeId,
      setTutorial,
      toggleTutorial,
      resetWorkspace,
    }),
    [ready, projectId, nodeId, tutorial, setProjectId, setNodeId, setTutorial, toggleTutorial, resetWorkspace],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}