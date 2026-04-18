import { task } from "@trigger.dev/sdk/v3";
import { executeCommand } from "@/server/executor/hocker-core-executor";

type HockerCoreExecutorPayload = {
  commandId: string;
  projectId?: string;
};

export const hockerCoreExecutor = task({
  id: "hocker-core-executor",
  maxDuration: 60,
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 2000,
    maxTimeoutInMs: 10000,
    factor: 2,
    randomize: true,
  },
  run: async (payload: HockerCoreExecutorPayload) => {
    if (!payload?.commandId || !payload.commandId.trim()) {
      throw new Error("commandId es obligatorio para ejecutar un nodo.");
    }

    const cleanCommandId = payload.commandId.trim();
    const cleanProjectId = payload.projectId?.trim() || undefined;

    await executeCommand(cleanCommandId, cleanProjectId);

    return {
      ok: true,
      commandId: cleanCommandId,
      projectId: cleanProjectId ?? null,
      executed: true,
      timestamp: new Date().toISOString(),
    };
  },
});