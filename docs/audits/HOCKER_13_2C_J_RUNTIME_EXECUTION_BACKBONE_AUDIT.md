# HOCKER ONE · 13-2C-J Runtime Real + AGI Execution Backbone Audit

## Objetivo

Auditar el núcleo real de ejecución AGI antes de tocar memory system, provider router o multi-agent orchestration.

## Resumen

- Fuentes activas escaneadas: `300`

## Decisión por archivo

### `src/lib/agi-action-execution.ts`

- Existe: `True`
- Líneas: `738`
- SHA256: `fb86b98362da8dd07b5e507abd382a60ce5c4bcbac98f7e93440850aac1fe1b8`
- Recomendación: `KEEP_RUNTIME_CORE`
- Referencias por filename: `0`
- Referencias por stem: `4`

#### Señales de riesgo
```json
{
  "mutation": [
    "",
    "POST",
    "PUT"
  ],
  "fetch": [
    "fetch("
  ],
  "secrets": [
    "GITHUB_TOKEN",
    "HOCKER_GITHUB_TOKEN",
    "SUPABASE_SERVICE_ROLE_KEY",
    "TOKEN",
    "Token",
    "token"
  ],
  "queue": [
    "Approval",
    "Queue",
    "Rollback",
    "approval",
    "dry_run",
    "queue",
    "rollback"
  ],
  "runtime": [
    "Runtime",
    "runtime"
  ]
}
```

#### Imports
```ts
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getGitHubRuntimeToken } from "@/lib/github-runtime-executor";
```

#### Exports / Functions
```ts
export type AgiActionQueueRow = {
export async function listAgiActions(params: { project_id: string; status?: string; tool_key?: string; limit?: number }): Promise<AgiActionQueueRow[]> {
export async function decideAgiAction(params: { project_id: string; action_id: string; decision: "approve" | "reject"; actor_id: string; note?: string }): Promise<AgiActionQueueRow> {
export async function executeApprovedAgiAction(params: { project_id: string; action_id: string; actor_id: string }): Promise<AgiActionQueueRow> {
function githubExecutionMode
function isMockedGithubBoundary
function mockedGithubResult
function envValue
function getAdminSupabase
function asRecord
function stringValue
function encodeSegment
function allowedRepositories
function parseRepository
function safeBranch
function allowedPathPrefixes
function safePath
function numberValue
function buildLockOwner
function buildRollbackPlan
async function claimApprovedQueueItem
function ensureNotMainBranch
async function githubRequest
async function getQueueItem
async function patchQueueItem
export async function listAgiActions
const GUIDED_GITHUB_CHAIN_VERSION =
const GUIDED_GITHUB_MATERIALIZER_VERSION =
const GUIDED_GITHUB_ACTION_ORDER =
function guidedGithubActionIndex
function isGuidedGithubTerminal
function isGuidedGithubExecuted
function guidedGithubBranchKey
async function getGuidedGithubChain
async function assertGuidedGithubApprovalOrder
async function assertGuidedGithubExecutionOrder
export async function decideAgiAction
async function executeCreateBranch
async function executeUpsertFile
async function executeCreatePr
export async function executeApprovedAgiAction
```

### `src/lib/agi-runtime-core.ts`

- Existe: `True`
- Líneas: `507`
- SHA256: `23837b89093b669efbdea4cdc480167f23ab59caefea25de60c897f6b60693d0`
- Recomendación: `KEEP_RUNTIME_CORE`
- Referencias por filename: `0`
- Referencias por stem: `10`

#### Señales de riesgo
```json
{
  "mutation": [
    ""
  ],
  "secrets": [
    "GITHUB_TOKEN",
    "HOCKER_GITHUB_TOKEN",
    "OPENAI_API_KEY",
    "PASSWORD",
    "SECRET",
    "SUPABASE_SERVICE_ROLE_KEY",
    "TOKEN",
    "Token",
    "secret"
  ],
  "queue": [
    "Approval",
    "approval",
    "dry_run",
    "enqueue",
    "queue"
  ],
  "runtime": [
    "Runtime"
  ]
}
```

#### Imports
```ts
import { createHash } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { AGI_REGISTRY } from "@/lib/hocker-dashboard";
```

#### Exports / Functions
```ts
export type RuntimeToolStatusKind = "configured" | "connected" | "partial" | "missing" | "blocked" | "missing_key" | "missing_code";
export type RuntimeTool = {
export type RuntimeToolStatus = RuntimeTool & {
export function getRuntimeToolCatalog(): RuntimeToolStatus[] {
export function getRuntimeToolSummary() {
export async function syncAgiRuntimeCatalog(project_id: string): Promise<{ ok: boolean; error?: string }> {
export async function getAgiRuntimeSummary(project_id: string) {
export async function enqueueAgiAction(input: {
function envValue
function hasEnv
function allEnvKeys
function buildGroups
function labelForStatus
function statusFor
export function getRuntimeToolCatalog
export function getRuntimeToolSummary
function stableJson
function buildAgiActionIdempotencyKey
function getAdminSupabase
async function safeCount
function agentDisplayName
function agentRole
function toolKeysForAgent
export async function syncAgiRuntimeCatalog
export async function getAgiRuntimeSummary
export async function enqueueAgiAction
```

### `src/lib/github-runtime-executor.ts`

- Existe: `True`
- Líneas: `508`
- SHA256: `cfdc088d844e2ef53cd35bac6aee805c5218fd1935bbdbe8decb5a4ffaa00a99`
- Recomendación: `KEEP_RUNTIME_CORE`
- Referencias por filename: `0`
- Referencias por stem: `3`

#### Señales de riesgo
```json
{
  "fetch": [
    "fetch("
  ],
  "secrets": [
    "GITHUB_TOKEN",
    "HOCKER_GITHUB_TOKEN",
    "TOKEN",
    "Token",
    "token"
  ],
  "queue": [
    "Rollback",
    "approval",
    "dry_run",
    "queue",
    "rollback"
  ],
  "runtime": [
    "Runtime"
  ]
}
```

#### Exports / Functions
```ts
export type GitHubRuntimeReadOperation =
export type GitHubRuntimeWriteOperation =
export type GitHubRuntimeOperation = GitHubRuntimeReadOperation | GitHubRuntimeWriteOperation;
export type GitHubRuntimeInput = {
export function getGitHubRuntimeToken(): string {
export function hasGitHubRuntimeToken(): boolean {
export function isGitHubWriteOperation(operation: string): operation is GitHubRuntimeWriteOperation {
export function isGitHubReadOperation(operation: string): operation is GitHubRuntimeReadOperation {
export function createGitHubWriteGatePlan(operation: GitHubRuntimeWriteOperation, input: GitHubRuntimeInput) {
export async function executeGitHubReadOperation(operation: GitHubRuntimeReadOperation, input: GitHubRuntimeInput) {
export function getGitHubExecutorStatus() {
function envValue
export function getGitHubRuntimeToken
export function hasGitHubRuntimeToken
export function isGitHubWriteOperation
export function isGitHubReadOperation
function defaultRepository
function parseRepository
function safePath
function safeRef
function encodeSegment
async function githubRequest
function trimContent
async function getRepo
async function listTree
async function readFile
async function compareRefs
async function auditPaths
function safeBranchName
function safeOptionalText
function contentStats
function buildRollbackPlan
export function createGitHubWriteGatePlan
export async function executeGitHubReadOperation
export function getGitHubExecutorStatus
```

### `src/app/api/agi/runtime/actions/route.ts`

- Existe: `True`
- Líneas: `87`
- SHA256: `4f6d3103da2ac0c87ab75726843f770a02d2c4d68b2abf7b603ce549aebb27d7`
- Recomendación: `KEEP_API_RUNTIME`
- Referencias por filename: `0`
- Referencias por stem: `34`

#### Señales de riesgo
```json
{
  "role_gate": [
    "requireProjectRole"
  ],
  "queue": [
    "approval",
    "dry_run",
    "enqueue"
  ],
  "runtime": [
    "Runtime",
    "force-dynamic",
    "nodejs",
    "runtime"
  ]
}
```

#### Imports
```ts
import { z } from "zod";
import { enqueueAgiAction } from "@/lib/agi-runtime-core";
import { listAgiActions } from "@/lib/agi-action-execution";
import { json, parseBody, parseQuery, requireProjectRole, toApiError } from "@/app/api/_lib";
```

#### Exports / Functions
```ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: Request): Promise<Response> {
export async function POST(req: Request): Promise<Response> {
export const runtime =
export const dynamic =
const ActionSchema =
export async function GET
export async function POST
```

### `src/app/api/agi/runtime/tools/route.ts`

- Existe: `True`
- Líneas: `38`
- SHA256: `6e67cce2deff2de1c2727329a9326db48c60191001b94f260ab9fc1e5fb7c751`
- Recomendación: `KEEP_API_RUNTIME`
- Referencias por filename: `0`
- Referencias por stem: `34`

#### Señales de riesgo
```json
{
  "role_gate": [
    "requireProjectRole"
  ],
  "secrets": [
    "secret"
  ],
  "runtime": [
    "Runtime",
    "force-dynamic",
    "nodejs",
    "runtime"
  ]
}
```

#### Imports
```ts
import { getRuntimeToolCatalog } from "@/lib/agi-runtime-core";
import { json, requireProjectRole, toApiError } from "@/app/api/_lib";
```

#### Exports / Functions
```ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: Request): Promise<Response> {
export const runtime =
export const dynamic =
export async function GET
```

### `src/app/api/agi/runtime/capabilities/route.ts`

- Existe: `True`
- Líneas: `55`
- SHA256: `40b24a670a993eff2fa5a7657eeea3db369079ef5f2f3908dbe5a0ca100c9905`
- Recomendación: `KEEP_API_RUNTIME`
- Referencias por filename: `0`
- Referencias por stem: `34`

#### Señales de riesgo
```json
{
  "role_gate": [
    "requireProjectRole"
  ],
  "runtime": [
    "force-dynamic",
    "nodejs",
    "runtime"
  ]
}
```

#### Imports
```ts
import { z } from "zod";
import { json, requireProjectRole, toApiError } from "@/app/api/_lib";
import { getCapabilityRegistrySnapshot, getHockerCapabilitiesContract } from "@/lib/hocker-capabilities-contract";
import { routeHockerCapabilityRequest } from "@/lib/hocker-tool-router";
```

#### Exports / Functions
```ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: Request): Promise<Response> {
export async function POST(req: Request): Promise<Response> {
export const runtime =
export const dynamic =
const RouteSchema =
export async function GET
export async function POST
```

### `src/app/api/agi/runtime/context/route.ts`

- Existe: `True`
- Líneas: `17`
- SHA256: `15873b32a172d69fb7e7aca064b947189bc14a588e9d80b2a705cb83d0060169`
- Recomendación: `KEEP_API_RUNTIME`
- Referencias por filename: `0`
- Referencias por stem: `34`

#### Señales de riesgo
```json
{
  "role_gate": [
    "requireProjectRole"
  ],
  "runtime": [
    "force-dynamic",
    "nodejs",
    "runtime"
  ]
}
```

#### Imports
```ts
import { json, parseQuery, requireProjectRole, toApiError } from "@/app/api/_lib";
import { getHockerContinuityContextPackWithMemory } from "@/lib/hocker-context-pack";
```

#### Exports / Functions
```ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: Request): Promise<Response> {
export const runtime =
export const dynamic =
export async function GET
```

### `src/app/api/agi/runtime/memory/route.ts`

- Existe: `True`
- Líneas: `22`
- SHA256: `dcc5c4e0fcd0b27fe8a33ab176f5a505a7e792b755a65c4b345c5bf62ba593d3`
- Recomendación: `KEEP_API_RUNTIME`
- Referencias por filename: `0`
- Referencias por stem: `34`

#### Señales de riesgo
```json
{
  "role_gate": [
    "requireProjectRole"
  ],
  "runtime": [
    "force-dynamic",
    "nodejs",
    "runtime"
  ]
}
```

#### Imports
```ts
import { json, parseQuery, requireProjectRole, toApiError } from "@/app/api/_lib";
import { getSyntiaOperationalMemorySnapshot } from "@/lib/syntia-operational-memory";
```

#### Exports / Functions
```ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: Request): Promise<Response> {
export const runtime =
export const dynamic =
export async function GET
```

### `src/trigger/hocker-core-executor.ts`

- Existe: `True`
- Líneas: `37`
- SHA256: `ec1addcf4495e37d049cc9adac97a2450155e89981efc57b485d74b87112400f`
- Recomendación: `KEEP_EXECUTOR_BACKEND`
- Referencias por filename: `0`
- Referencias por stem: `5`

#### Señales de riesgo
```json
{
  "queue": [
    "retry"
  ]
}
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
- SHA256: `272bf395a70f7fd4f78230719b45bc59af31592021151d88965d333401ed50dc`
- Recomendación: `KEEP_EXECUTOR_BACKEND`
- Referencias por filename: `0`
- Referencias por stem: `5`

#### Señales de riesgo
```json
{
  "queue": [
    "Queue",
    "approval",
    "queue"
  ]
}
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

## Comparativa executor trigger vs server

- Ambos existen: `True`
- Mismo hash: `False`
- Similaridad: `0.091`

```diff
--- /root/HOCKER_PUSH_REAL/hocker.one/src/trigger/hocker-core-executor.ts
+++ /root/HOCKER_PUSH_REAL/hocker.one/src/server/executor/hocker-core-executor.ts
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

## Veredicto preliminar

- `agi-action-execution.ts`: núcleo crítico; no mover sin consolidación.
- `agi-runtime-core.ts`: pieza crítica de orquestación; mantener y auditar antes de refactor.
- `github-runtime-executor.ts`: integrar sólo si conserva seguridad y rollback.
- `api/runtime/*`: asegurar compatibilidad con approvals, dry_run y role gates.
- `trigger/server executor`: no fusionar todavía; primero decidir si son wrapper + implementación o duplicado real.
