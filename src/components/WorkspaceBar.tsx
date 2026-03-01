"use client";

import React from "react";
import { useWorkspace } from "@/components/WorkspaceContext";

export default function WorkspaceBar() {
  const { projectId, nodeId, tutorial, setProjectId, setNodeId, setTutorial, reset } = useWorkspace();

  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
          <span className="text-xs font-semibold text-slate-600">Proyecto</span>
          <input
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            className="w-44 bg-transparent outline-none"
            placeholder="global"
          />
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
          <span className="text-xs font-semibold text-slate-600">Nodo</span>
          <input
            value={nodeId}
            onChange={(e) => setNodeId(e.target.value)}
            className="w-56 bg-transparent outline-none"
            placeholder="node-hocker-01"
          />
        </div>

        <button
          type="button"
          onClick={reset}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          title="Reset"
        >
          Reset
        </button>
      </div>

      <button
        type="button"
        onClick={() => setTutorial(!tutorial)}
        className={`rounded-xl px-3 py-2 text-sm font-semibold ${
          tutorial ? "bg-blue-600 text-white" : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
        }`}
        title="Ayudas dentro de pantallas"
      >
        Tutorial: {tutorial ? "ON" : "OFF"}
      </button>
    </div>
  );
}