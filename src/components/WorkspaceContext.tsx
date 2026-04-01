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
  projectId: "hocker-one",
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
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        setState({
          projectId: typeof parsed.projectId === "string" ? parsed.projectId : DEFAULTS.projectId,
          nodeId: typeof parsed.nodeId === "string" ? parsed.nodeId : DEFAULTS.nodeId,
          tutorial: typeof parsed.tutorial === "boolean" ? parsed.tutorial : DEFAULTS.tutorial,
        });
      }
    } catch {
      // Sincronización silenciosa en caso de memoria corrupta
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // Prevención de cuellos de botella en el almacenamiento del navegador
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
  if (!ctx) throw new Error("useWorkspace debe operar dentro de un WorkspaceProvider táctico.");
  return ctx;
}
