"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
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
  reset: () => void;
};

const DEFAULTS: WorkspaceState = {
  projectId: defaultProjectId(),
  nodeId: defaultNodeId(),
  tutorial: true,
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
        const parsed: unknown = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          const p = parsed as Record<string, unknown>;
          setState({
            projectId: typeof p.projectId === "string" ? p.projectId : DEFAULTS.projectId,
            nodeId: typeof p.nodeId === "string" ? p.nodeId : DEFAULTS.nodeId,
            tutorial: typeof p.tutorial === "boolean" ? p.tutorial : DEFAULTS.tutorial,
          });
        }
      }
    } catch {
      // sin ruido
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // sin bloqueo del UI
    }
  }, [state, ready]);

  const value = useMemo<WorkspaceCtx>(
    () => ({
      ...state,
      setProjectId: (v) =>
        setState((s) => ({ ...s, projectId: v.trim() || DEFAULTS.projectId })),
      setNodeId: (v) =>
        setState((s) => ({ ...s, nodeId: v.trim() || DEFAULTS.nodeId })),
      setTutorial: (v) => setState((s) => ({ ...s, tutorial: Boolean(v) })),
      reset: () => setState(DEFAULTS),
    }),
    [state],
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