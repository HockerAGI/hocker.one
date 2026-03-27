"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type WorkspaceState = {
  projectId: string;
  nodeId: string;
  tutorial: boolean;
};

type WorkspaceCtx = WorkspaceState & {
  setProjectId: (v: string) => void;
  setNodeId: (v: string) => void;
  setTutorial: (v: boolean) => void;
  reset: () => void;
};

const DEFAULTS: WorkspaceState = {
  projectId: "global",
  nodeId: "hocker-node-1",
  tutorial: false,
};

const KEY = "hocker.workspace.v1";

const Ctx = createContext<WorkspaceCtx | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WorkspaceState>(DEFAULTS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<WorkspaceState>;
        setState({
          projectId: parsed.projectId || DEFAULTS.projectId,
          nodeId: parsed.nodeId || DEFAULTS.nodeId,
          tutorial: Boolean(parsed.tutorial),
        });
      }
    } catch {
      // ignore
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state, ready]);

  const value = useMemo<WorkspaceCtx>(
    () => ({
      ...state,
      setProjectId: (v) => setState((s) => ({ ...s, projectId: v || DEFAULTS.projectId })),
      setNodeId: (v) => setState((s) => ({ ...s, nodeId: v || DEFAULTS.nodeId })),
      setTutorial: (v) => setState((s) => ({ ...s, tutorial: Boolean(v) })),
      reset: () => setState(DEFAULTS),
    }),
    [state]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    return {
      ...DEFAULTS,
      setProjectId: () => {},
      setNodeId: () => {},
      setTutorial: () => {},
      reset: () => {},
    } as WorkspaceCtx;
  }
  return ctx;
}
