"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import NovaRealtimeChatLazy from "@/components/NovaRealtimeChatLazy";
import { GuidedGitHubChainCard } from "@/components/GuidedGitHubChainCard";
import { useWorkspace } from "@/components/WorkspaceContext";
import type { ActionListResponse, RuntimeAction } from "@/components/nova-chat-types";
import { buildGuidedGitHubChain } from "@/components/nova-chat-helpers";

type MutationResponse = {
  ok?: boolean;
  message?: string;
  error?: string;
  mfa_required?: boolean;
  owner_gate_reason?: string;
};

export default function NovaWorkspace() {
  const router = useRouter();
  const { projectId, ready } = useWorkspace();
  const [actions, setActions] = useState<RuntimeAction[]>([]);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadActions = useCallback(async () => {
    if (!ready) return;
    try {
      const response = await fetch(`/api/agi/runtime/actions?project_id=${encodeURIComponent(projectId)}`, { cache: "no-store" });
      const body = await response.json().catch(() => ({})) as ActionListResponse;
      if (response.ok && Array.isArray(body.actions)) {
        setActions(body.actions);
      }
    } catch {
      // NOVA remains usable when the supplemental action view is temporarily unavailable.
    }
  }, [projectId, ready]);

  useEffect(() => {
    void loadActions();
    const timer = window.setInterval(() => void loadActions(), 20_000);
    return () => window.clearInterval(timer);
  }, [loadActions]);

  const guidedGithubChain = useMemo(() => buildGuidedGitHubChain(actions), [actions]);

  const mutateAction = useCallback(async (
    action: RuntimeAction,
    mode: "approve" | "reject" | "execute",
  ) => {
    if (busyAction) return;
    setBusyAction(action.id);
    setNotice(null);

    try {
      const endpoint = mode === "execute"
        ? "/api/agi/runtime/actions/execute"
        : "/api/agi/runtime/actions/decision";
      const payload = mode === "execute"
        ? { project_id: projectId, action_id: action.id }
        : { project_id: projectId, action_id: action.id, decision: mode };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => ({})) as MutationResponse;

      if (!response.ok || body.ok === false) {
        if (body.mfa_required || body.owner_gate_reason === "owner_mfa_required") {
          router.push(`/auth/mfa?returnTo=${encodeURIComponent("/app/nova")}`);
          return;
        }
        throw new Error(body.message || body.error || "No se pudo completar la acción.");
      }

      setNotice(body.message || (mode === "execute" ? "Ejecución registrada." : "Decisión registrada."));
      await loadActions();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "No se pudo completar la acción.");
    } finally {
      setBusyAction(null);
    }
  }, [busyAction, loadActions, projectId, router]);

  return (
    <div className="flex min-h-[calc(100dvh-96px)] w-full flex-col gap-3">
      {notice ? (
        <div className="rounded-[14px] border border-white/[0.07] bg-white/[0.025] px-4 py-3 text-xs text-slate-300">
          {notice}
        </div>
      ) : null}

      {guidedGithubChain ? (
        <GuidedGitHubChainCard
          chain={guidedGithubChain}
          busyAction={busyAction}
          onShowSummary={() => void loadActions()}
          onMutate={(action, mode) => { void mutateAction(action, mode); }}
        />
      ) : null}

      <div className="min-h-0 flex-1">
        <NovaRealtimeChatLazy />
      </div>
    </div>
  );
}
