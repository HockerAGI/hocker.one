# HOCKER ONE · 13-2C-I-F Second Archive Candidate Audit

## Objetivo

Inspeccionar contenido real y referencias de candidatos vivos post-archive. Esta fase no mueve, no borra y no fusiona.

## Resumen

- targets: `5`
- active_sources_scanned: `300`

## Resultado por archivo

### `src/components/NovaChat.tsx`

- Existe: `True`
- Líneas: `547`
- SHA256: `fd27ece77867d50c`
- Recomendación: `KEEP_OR_REVIEW_REFERENCED`
- Referencias por filename: `0`
- Referencias por stem: `6`

#### Referencias
```text
src/app/api/nova/chat/route.ts
src/app/api/nova/chat/stream/route.ts
src/lib/hocker-context-pack.ts
src/lib/hocker-tool-router.ts
src/lib/nova-chat-action-drafts.ts
src/lib/nova-github-action-materializer.ts
```

#### Imports
```ts
import {
import {
import { useWorkspace } from "@/components/WorkspaceContext";
```

#### Exports / Functions
```ts
export default function NovaChat() {
const QUICK_STARTS =
function cx
function makeId
function fileKind
```

#### Señales de riesgo
```json
{
  "client_component": [
    "\"use client\""
  ],
  "fetch": [
    "fetch("
  ],
  "mutation": [
    "POST"
  ]
}
```

### `src/components/ErrorBoundary.tsx`

- Existe: `True`
- Líneas: `111`
- SHA256: `b2fa3a8d31e4f982`
- Recomendación: `KEEP_OR_REVIEW_REFERENCED`
- Referencias por filename: `0`
- Referencias por stem: `3`

#### Referencias
```text
src/components/hocker-2c/owner/OwnerShell.tsx
src/components/hocker-2c/owner/fusion/OwnerErrorBoundary.tsx
src/components/hocker-2c/owner/index.ts
```

#### Imports
```ts
import type { ErrorInfo, ReactNode } from "react";
import { Component } from "react";
```

#### Exports / Functions
```ts
export default class ErrorBoundary extends Component<
function DefaultFallback
```

#### Señales de riesgo
```json
{
  "client_component": [
    "\"use client\""
  ]
}
```

### `src/components/SystemStatus.tsx`

- Existe: `True`
- Líneas: `227`
- SHA256: `f4aae5f1de03c877`
- Recomendación: `KEEP_OR_REVIEW_REFERENCED`
- Referencias por filename: `0`
- Referencias por stem: `1`

#### Referencias
```text
src/lib/hocker-system-registry-2c.ts
```

#### Imports
```ts
import { useCallback, useEffect, useMemo, useState } from "react";
import { CircleDot, RefreshCw, ShieldAlert, SignalHigh, Sparkles } from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import type { DashboardSummary } from "@/lib/hocker-dashboard";
```

#### Exports / Functions
```ts
export default function SystemStatus({ summary }: Props) {
function formatRelativeTime
```

#### Señales de riesgo
```json
{
  "client_component": [
    "\"use client\""
  ],
  "supabase": [
    "Supabase",
    "createBrowser",
    "supabase"
  ]
}
```

### `src/trigger/hocker-core-executor.ts`

- Existe: `True`
- Líneas: `37`
- SHA256: `ec1addcf4495e37d`
- Recomendación: `KEEP_OR_REVIEW_REFERENCED`
- Referencias por filename: `0`
- Referencias por stem: `4`

#### Referencias
```text
src/app/api/commands/approve/route.ts
src/app/api/commands/route.ts
src/app/api/execute/route.ts
src/app/api/orchestrator/run/route.ts
```

#### Imports
```ts
import { task } from "@trigger.dev/sdk/v3";
import { executeCommand } from "@/server/executor/hocker-core-executor";
```

#### Exports / Functions
```ts
export const hockerCoreExecutor = task({
export const hockerCoreExecutor =
```

### `src/server/executor/hocker-core-executor.ts`

- Existe: `True`
- Líneas: `39`
- SHA256: `272bf395a70f7fd4`
- Recomendación: `KEEP_OR_REVIEW_REFERENCED`
- Referencias por filename: `0`
- Referencias por stem: `5`

#### Referencias
```text
src/app/api/commands/approve/route.ts
src/app/api/commands/route.ts
src/app/api/execute/route.ts
src/app/api/orchestrator/run/route.ts
src/trigger/hocker-core-executor.ts
```

#### Imports
```ts
import { createAdminSupabase } from "@/lib/supabase-admin";
import { processCloudQueue } from "@/app/api/commands/_cloud";
```

#### Exports / Functions
```ts
export async function executeCommand(commandId: string, expectedProjectId?: string): Promise<void> {
function isCloudNode
export async function executeCommand
```

#### Señales de riesgo
```json
{
  "supabase": [
    "Supabase",
    "supabase"
  ]
}
```

## Comparativa hocker-core-executor

- Ambos existen: `True`
- Mismo hash: `False`
- Similaridad: `0.091`

### Diff preview
```diff
--- src/trigger/hocker-core-executor.ts
+++ src/server/executor/hocker-core-executor.ts
@@ -1,37 +1,39 @@
-import { task } from "@trigger.dev/sdk/v3";
-import { executeCommand } from "@/server/executor/hocker-core-executor";
+import { createAdminSupabase } from "@/lib/supabase-admin";
+import { processCloudQueue } from "@/app/api/commands/_cloud";
 
-type HockerCoreExecutorPayload = {
-  commandId: string;
-  projectId?: string;
-};
+function isCloudNode(nodeId: string | null | undefined): boolean {
+  return String(nodeId ?? "").startsWith("cloud-");
+}
 
-export const hockerCoreExecutor = task({
-  id: "hocker-core-executor",
-  maxDuration: 60,
-  retry: {
-    maxAttempts: 3,
-    minTimeoutInMs: 2000,
-    maxTimeoutInMs: 10000,
-    factor: 2,
-    randomize: true,
-  },
-  run: async (payload: HockerCoreExecutorPayload) => {
-    if (!payload?.commandId || !payload.commandId.trim()) {
-      throw new Error("commandId es obligatorio para ejecutar un nodo.");
-    }
+export async function executeCommand(commandId: string, expectedProjectId?: string): Promise<void> {
+  const sb = createAdminSupabase();
 
-    const cleanCommandId = payload.commandId.trim();
-    const cleanProjectId = payload.projectId?.trim() || undefined;
+  const { data: command, error } = await sb
+    .from("commands")
+    .select("*")
+    .eq("id", commandId)
+    .maybeSingle();
 
-    await executeCommand(cleanCommandId, cleanProjectId);
+  if (error || !command) return;
 
-    return {
-      ok: true,
-      commandId: cleanCommandId,
-      projectId: cleanProjectId ?? null,
-      executed: true,
-      timestamp: new Date().toISOString(),
-    };
-  },
-});
+  if (expectedProjectId && command.project_id !== expectedProjectId) {
+    return;
+  }
+
+  if (!isCloudNode(command.node_id)) {
+    return;
+  }
+
+  if (command.status !== "queued" && command.status !== "needs_approval") {
+    return;
+  }
+
+  if (command.needs_approval) {
+    return;
+  }
+
+  await processCloudQueue(sb, {
+    commandId,
+    nodeId: command.node_id,
+  });
+}
```

## Decisión preliminar

- `NovaChat.tsx`: archivar sólo si sus referencias son falsos positivos y el flujo 2C ya cubre todo.
- `ErrorBoundary.tsx`: archivar si `OwnerErrorBoundary` cubre el rol y no hay imports reales.
- `SystemStatus.tsx`: archivar si `OwnerSystemPulsePanel` cubre el rol y no hay imports reales.
- Ejecutores trigger/server: no mover sin auditoría backend dedicada.
