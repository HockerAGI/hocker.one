import { task } from "@trigger.dev/sdk/v3";
import { executeCommand } from "@/server/executor/hocker-core-executor";

type HockerCoreExecutorPayload = {
  commandId: string;
  projectId?: string;
};

export const hockerCoreExecutor = task({
  id: "hocker-core-executor",
  run: async (payload: HockerCoreExecutorPayload) => {
    if (!payload?.commandId || !payload.commandId.trim()) {
      throw new Error("commandId es obligatorio.");
    }

    await executeCommand(payload.commandId.trim());

    return {
      ok: true,
      commandId: payload.commandId.trim(),
      projectId: payload.projectId ?? null,
    };
  },
});