"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { defaultNodeId, defaultProjectId } from "@/lib/project";

type WorkspaceState = {
  projectId: string;
  nodeId: string;
  tutorial: boolean;
};

type WorkspaceCtx = WorkspaceState & {
  setProjectId: (v: string) => void;
  setNodeId: (v: string) => void;
  setTutorial: (v: boolean) => void;
  toggleTutorial: () => void;
  reset: () => void;
  refresh: () => void;
  version: number;
};

function createDefaults(): WorkspaceState {
  return {
    projectId: defaultProjectId(),
    nodeId: defaultNodeId(),
    tutorial: true,
  };
}

const KEY = "hocker.workspace.v3";
const Ctx = createContext<WorkspaceCtx | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WorkspaceState>(() => createDefaults());
  const [ready, setReady] = useState(false);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => {
    setVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          const p = parsed as Record<string, unknown>;
          setState({
            projectId:
              typeof p.projectId === "string" && p.projectId.trim()
                ? p.projectId.trim()
                : defaultProjectId(),
            nodeId:
              typeof p.nodeId === "string" && p.nodeId.trim()
                ? p.nodeId.trim()
                : defaultNodeId(),
            tutorial: typeof p.tutorial === "boolean" ? p.tutorial : true,
          });
        }
      }
    } catch {
      // silent
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;

    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // no-op
    }
  }, [state, ready]);

  const value = useMemo<WorkspaceCtx>(
    () => ({
      ...state,
      version,
      setProjectId: (v) =>
        setState((s) => ({
          ...s,
          projectId: v.trim() || defaultProjectId(),
        })),
      setNodeId: (v) =>
        setState((s) => ({
          ...s,
          nodeId: v.trim() || defaultNodeId(),
        })),
      setTutorial: (v) => setState((s) => ({ ...s, tutorial: Boolean(v) })),
      toggleTutorial: () => setState((s) => ({ ...s, tutorial: !s.tutorial })),
      reset: () => setState(createDefaults()),
      refresh,
    }),
    [refresh, state, version],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWorkspace(): WorkspaceCtx {
  const ctx = useContext(Ctx);
  if (!ctx) {
    throw new Error("useWorkspace debe usarse dentro de WorkspaceProvider.");
  }
  return ctx;
}