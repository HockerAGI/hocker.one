# HOCKER ONE · 13-2C-K Runtime Hardening Real Audit

## Objetivo
Identificar y concretar las piezas necesarias para hardening real del runtime AGI: colas, reintentos, trazas, idempotencia, recovery, aislamiento y observabilidad.

## Resumen
- Fuentes activas escaneadas: `300`

## Hallazgos por archivo

### `src/lib/agi-action-execution.ts`
- Existe: `True`
- Líneas: `738`
- SHA256: `fb86b98362da8dd07b5e507abd382a60ce5c4bcbac98f7e93440850aac1fe1b8`
- Recomendación: `IMPLEMENT_QUEUE_RETRY_IDEMPOTENCY`
- Conteos: `{'queue': 51, 'trace': 0, 'idempotency': 5, 'observability': 0, 'isolation': 0, 'approval': 8, 'signed': 0, 'state': 24, 'secrets': 3}`
#### Imports
```ts
import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getGitHubRuntimeToken } from "@/lib/github-runtime-executor";
```
#### Exports
```ts
export type AgiActionQueueRow = {
export async function listAgiActions(params: { project_id: string; status?: string; tool_key?: string; limit?: number }): Promise<AgiActionQueueRow[]> {
export async function decideAgiAction(params: { project_id: string; action_id: string; decision: "approve" | "reject"; actor_id: string; note?: string }): Promise<AgiActionQueueRow> {
export async function executeApprovedAgiAction(params: { project_id: string; action_id: string; actor_id: string }): Promise<AgiActionQueueRow> {
```

### `src/lib/agi-runtime-core.ts`
- Existe: `True`
- Líneas: `507`
- SHA256: `23837b89093b669efbdea4cdc480167f23ab59caefea25de60c897f6b60693d0`
- Recomendación: `IMPLEMENT_HARDENING_CONFIG_AND_LIMITS`
- Conteos: `{'queue': 8, 'trace': 0, 'idempotency': 13, 'observability': 11, 'isolation': 0, 'approval': 38, 'signed': 0, 'state': 3, 'secrets': 17}`
#### Imports
```ts
import { createHash } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { AGI_REGISTRY } from "@/lib/hocker-dashboard";
```
#### Exports
```ts
export type RuntimeToolStatusKind = "configured" | "connected" | "partial" | "missing" | "blocked" | "missing_key" | "missing_code";
export type RuntimeTool = {
export type RuntimeToolStatus = RuntimeTool & {
export function getRuntimeToolCatalog(): RuntimeToolStatus[] {
export function getRuntimeToolSummary() {
export async function syncAgiRuntimeCatalog(project_id: string): Promise<{ ok: boolean; error?: string }> {
export async function getAgiRuntimeSummary(project_id: string) {
export async function enqueueAgiAction(input: {
```

### `src/lib/github-runtime-executor.ts`
- Existe: `True`
- Líneas: `508`
- SHA256: `cfdc088d844e2ef53cd35bac6aee805c5218fd1935bbdbe8decb5a4ffaa00a99`
- Recomendación: `HARDEN_GITHUB_ACTION_BOUNDARIES`
- Conteos: `{'queue': 6, 'trace': 0, 'idempotency': 0, 'observability': 0, 'isolation': 0, 'approval': 3, 'signed': 0, 'state': 0, 'secrets': 6}`
#### Exports
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
```

### `src/app/api/agi/runtime/actions/route.ts`
- Existe: `True`
- Líneas: `87`
- SHA256: `4f6d3103da2ac0c87ab75726843f770a02d2c4d68b2abf7b603ce549aebb27d7`
- Recomendación: `ADD_TRACE_AND_STATE_GUARDS`
- Conteos: `{'queue': 2, 'trace': 0, 'idempotency': 0, 'observability': 0, 'isolation': 0, 'approval': 12, 'signed': 0, 'state': 0, 'secrets': 0}`
#### Imports
```ts
import { z } from "zod";
import { enqueueAgiAction } from "@/lib/agi-runtime-core";
import { listAgiActions } from "@/lib/agi-action-execution";
import { json, parseBody, parseQuery, requireProjectRole, toApiError } from "@/app/api/_lib";
```
#### Exports
```ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: Request): Promise<Response> {
export async function POST(req: Request): Promise<Response> {
```

### `src/app/api/agi/runtime/tools/route.ts`
- Existe: `True`
- Líneas: `38`
- SHA256: `6e67cce2deff2de1c2727329a9326db48c60191001b94f260ab9fc1e5fb7c751`
- Recomendación: `ADD_TRACE_AND_STATE_GUARDS`
- Conteos: `{'queue': 0, 'trace': 0, 'idempotency': 0, 'observability': 3, 'isolation': 0, 'approval': 2, 'signed': 0, 'state': 0, 'secrets': 1}`
#### Imports
```ts
import { getRuntimeToolCatalog } from "@/lib/agi-runtime-core";
import { json, requireProjectRole, toApiError } from "@/app/api/_lib";
```
#### Exports
```ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: Request): Promise<Response> {
```

### `src/app/api/agi/runtime/capabilities/route.ts`
- Existe: `True`
- Líneas: `55`
- SHA256: `40b24a670a993eff2fa5a7657eeea3db369079ef5f2f3908dbe5a0ca100c9905`
- Recomendación: `ADD_TRACE_AND_STATE_GUARDS`
- Conteos: `{'queue': 0, 'trace': 0, 'idempotency': 0, 'observability': 0, 'isolation': 0, 'approval': 3, 'signed': 0, 'state': 0, 'secrets': 0}`
#### Imports
```ts
import { z } from "zod";
import { json, requireProjectRole, toApiError } from "@/app/api/_lib";
import { getCapabilityRegistrySnapshot, getHockerCapabilitiesContract } from "@/lib/hocker-capabilities-contract";
import { routeHockerCapabilityRequest } from "@/lib/hocker-tool-router";
```
#### Exports
```ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: Request): Promise<Response> {
export async function POST(req: Request): Promise<Response> {
```

### `src/app/api/agi/runtime/context/route.ts`
- Existe: `True`
- Líneas: `17`
- SHA256: `15873b32a172d69fb7e7aca064b947189bc14a588e9d80b2a705cb83d0060169`
- Recomendación: `ADD_TRACE_AND_STATE_GUARDS`
- Conteos: `{'queue': 0, 'trace': 0, 'idempotency': 0, 'observability': 0, 'isolation': 0, 'approval': 2, 'signed': 0, 'state': 0, 'secrets': 0}`
#### Imports
```ts
import { json, parseQuery, requireProjectRole, toApiError } from "@/app/api/_lib";
import { getHockerContinuityContextPackWithMemory } from "@/lib/hocker-context-pack";
```
#### Exports
```ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: Request): Promise<Response> {
```

### `src/app/api/agi/runtime/memory/route.ts`
- Existe: `True`
- Líneas: `22`
- SHA256: `dcc5c4e0fcd0b27fe8a33ab176f5a505a7e792b755a65c4b345c5bf62ba593d3`
- Recomendación: `ADD_TRACE_AND_STATE_GUARDS`
- Conteos: `{'queue': 0, 'trace': 0, 'idempotency': 0, 'observability': 0, 'isolation': 0, 'approval': 2, 'signed': 0, 'state': 0, 'secrets': 0}`
#### Imports
```ts
import { json, parseQuery, requireProjectRole, toApiError } from "@/app/api/_lib";
import { getSyntiaOperationalMemorySnapshot } from "@/lib/syntia-operational-memory";
```
#### Exports
```ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(req: Request): Promise<Response> {
```

### `src/trigger/hocker-core-executor.ts`
- Existe: `True`
- Líneas: `37`
- SHA256: `ec1addcf4495e37d049cc9adac97a2450155e89981efc57b485d74b87112400f`
- Recomendación: `VERIFY_EXECUTOR_BOUNDARY`
- Conteos: `{'queue': 1, 'trace': 0, 'idempotency': 0, 'observability': 0, 'isolation': 0, 'approval': 0, 'signed': 0, 'state': 0, 'secrets': 0}`
#### Imports
```ts
import { task } from "@trigger.dev/sdk/v3";
import { executeCommand } from "@/server/executor/hocker-core-executor";
```
#### Exports
```ts
export const hockerCoreExecutor = task({
```

### `src/server/executor/hocker-core-executor.ts`
- Existe: `True`
- Líneas: `39`
- SHA256: `272bf395a70f7fd4f78230719b45bc59af31592021151d88965d333401ed50dc`
- Recomendación: `VERIFY_EXECUTOR_BOUNDARY`
- Conteos: `{'queue': 3, 'trace': 0, 'idempotency': 0, 'observability': 0, 'isolation': 0, 'approval': 2, 'signed': 0, 'state': 3, 'secrets': 0}`
#### Imports
```ts
import { createAdminSupabase } from "@/lib/supabase-admin";
import { processCloudQueue } from "@/app/api/commands/_cloud";
```
#### Exports
```ts
export async function executeCommand(commandId: string, expectedProjectId?: string): Promise<void> {
```

## Lectura operativa
- `agi-action-execution.ts` debe concentrar queue/retry/idempotency.
- `agi-runtime-core.ts` debe alojar hardening config y límites.
- `github-runtime-executor.ts` debe blindar operaciones de repo.
- `api/runtime/*` debe propagar trace/state/approval sin ejecutar de más.
- `trigger/server executor` debe conservar separación wrapper vs backend.
