# HOCKER ONE · 13-2C-I-D Archive Legacy After Full Fusion

## Objetivo

Archivar legacy/pre-2C después de completar fusión de NOVA, voz, registries, UI legacy útil, AuthBox/login y export server-only.

## Seguridad

- No se elimina nada.
- Se usa `git mv`.
- Si un archivo tiene referencias activas en código, se conserva.
- No se toca runtime sensible.
- No se toca auth endpoint.
- No se toca middleware/proxy.
- Typecheck/build obligatorios antes de commit.

## Base estable requerida

`stable-hocker-one-phase13-2c-i-c3c-evidence-export-server-only`

## Resultado por archivo


### `src/components/NovaChat.tsx`

- Resultado: KEEP
- Motivo: referencias activas detectadas en código.

```text
src/app/api/nova/chat/route.ts:5:import { buildNovaChatActionDraftPreview } from "@/lib/nova-chat-action-drafts";
src/app/api/nova/chat/route.ts:7:import { buildNovaCapabilitiesReply, buildNovaChatCapabilitiesContext, buildNovaUpstreamRuntimeContext, shouldAnswerCapabilitiesLocally } from "@/lib/hocker-tool-router";
src/app/api/nova/chat/route.ts:25:type NovaChatResponse = {
src/app/api/nova/chat/route.ts:48:function sanitizeNovaPayload(payload: NovaChatResponse, injectedMeta: Record<string, unknown>, localActionDraft: Record<string, unknown> | null = null): Record<string, unknown> {
src/app/api/nova/chat/route.ts:117:  const capabilitiesContract = buildNovaChatCapabilitiesContext(parsed.data.message, parsed.data.project_id);
src/app/api/nova/chat/route.ts:122:  const draftPreview = buildNovaChatActionDraftPreview({
src/app/api/nova/chat/route.ts:238:    const responseJson = (await res.json().catch(() => ({}))) as NovaChatResponse;
src/app/api/nova/chat/stream/route.ts:4:import { buildNovaCapabilitiesReply, buildNovaChatCapabilitiesContext, buildNovaUpstreamRuntimeContext, shouldAnswerCapabilitiesLocally } from "@/lib/hocker-tool-router";
src/app/api/nova/chat/stream/route.ts:20:type NovaChatResponse = {
src/app/api/nova/chat/stream/route.ts:44:  const capabilitiesContract = buildNovaChatCapabilitiesContext(String(body.message ?? ""), body.project_id);
src/app/api/nova/chat/stream/route.ts:93:  const data = (await res.json().catch(() => ({}))) as NovaChatResponse;
src/app/api/nova/chat/stream/route.ts:148:          const capabilitiesContract = buildNovaChatCapabilitiesContext(parsed.data.message, parsed.data.project_id);
src/lib/hocker-context-pack.ts:11:import { getNovaChatActionDraftPublicContext } from "@/lib/nova-chat-action-drafts";
src/lib/hocker-context-pack.ts:128:    nova_chat_action_drafts: getNovaChatActionDraftPublicContext(),
src/lib/hocker-tool-router.ts:89:export function buildNovaChatCapabilitiesContext(
src/lib/hocker-tool-router.ts:194:export function buildNovaCapabilitiesReply(context: ReturnType<typeof buildNovaChatCapabilitiesContext>): string {
src/lib/hocker-tool-router.ts:227:  capabilitiesContext: ReturnType<typeof buildNovaChatCapabilitiesContext>,
src/lib/nova-chat-action-drafts.ts:52:export function getNovaChatActionDraftPublicContext() {
src/lib/nova-chat-action-drafts.ts:86:export function detectNovaChatActionDraft(message: string, queueLock?: QueueLockLike | null): DraftDecision {
src/lib/nova-chat-action-drafts.ts:188:export function buildNovaChatActionDraftPreview(params: {
src/lib/nova-chat-action-drafts.ts:193:  const decision = detectNovaChatActionDraft(params.message, params.queue_lock);
src/lib/nova-chat-action-drafts.ts:225:    public_context: getNovaChatActionDraftPublicContext(),
src/lib/nova-chat-action-drafts.ts:229:export async function enqueueNovaChatActionDraft(params: {
src/lib/nova-chat-action-drafts.ts:235:  const preview = buildNovaChatActionDraftPreview(params);
src/lib/nova-github-action-materializer.ts:4:  buildNovaChatActionDraftPreview,
src/lib/nova-github-action-materializer.ts:5:  getNovaChatActionDraftPublicContext,
src/lib/nova-github-action-materializer.ts:227:  const preview = buildNovaChatActionDraftPreview({
src/lib/nova-github-action-materializer.ts:315:      action_drafts: getNovaChatActionDraftPublicContext(),
```

### `src/app/app/nova/page.legacy-13fixa1.tsx`

- Resultado: ARCHIVED
- Destino: `docs/archive/pre-2c/13-2c-i-d/src/app/app/nova/page.legacy-13fixa1.tsx`
- Motivo: sin referencias activas detectadas en código.

### `src/components/ErrorBoundary.tsx`

- Resultado: KEEP
- Motivo: referencias activas detectadas en código.

```text
src/components/hocker-2c/owner/OwnerShell.tsx:7:import { OwnerErrorBoundary } from "./fusion/OwnerErrorBoundary";
src/components/hocker-2c/owner/OwnerShell.tsx:88:          <OwnerErrorBoundary>{children}</OwnerErrorBoundary>
src/components/hocker-2c/owner/index.ts:8:export * from "./fusion/OwnerErrorBoundary";
src/components/hocker-2c/owner/fusion/OwnerErrorBoundary.tsx:6:type OwnerErrorBoundaryProps = {
src/components/hocker-2c/owner/fusion/OwnerErrorBoundary.tsx:10:type OwnerErrorBoundaryState = {
src/components/hocker-2c/owner/fusion/OwnerErrorBoundary.tsx:15:export class OwnerErrorBoundary extends Component<OwnerErrorBoundaryProps, OwnerErrorBoundaryState> {
src/components/hocker-2c/owner/fusion/OwnerErrorBoundary.tsx:16:  state: OwnerErrorBoundaryState = {
src/components/hocker-2c/owner/fusion/OwnerErrorBoundary.tsx:21:  static getDerivedStateFromError(error: Error): OwnerErrorBoundaryState {
src/components/hocker-2c/owner/fusion/OwnerErrorBoundary.tsx:29:    console.error("[OwnerErrorBoundary]", error, errorInfo.componentStack);
```

### `src/components/BrandMark.tsx`

- Resultado: ARCHIVED
- Destino: `docs/archive/pre-2c/13-2c-i-d/src/components/BrandMark.tsx`
- Motivo: sin referencias activas detectadas en código.

### `src/components/AppNav.tsx`

- Resultado: ARCHIVED
- Destino: `docs/archive/pre-2c/13-2c-i-d/src/components/AppNav.tsx`
- Motivo: sin referencias activas detectadas en código.

### `src/components/CommandBoxClient.tsx`

- Resultado: ARCHIVED
- Destino: `docs/archive/pre-2c/13-2c-i-d/src/components/CommandBoxClient.tsx`
- Motivo: sin referencias activas detectadas en código.

### `src/components/InteractiveBackground.tsx`

- Resultado: ARCHIVED
- Destino: `docs/archive/pre-2c/13-2c-i-d/src/components/InteractiveBackground.tsx`
- Motivo: sin referencias activas detectadas en código.

### `src/components/EventsFeed.tsx`

- Resultado: ARCHIVED
- Destino: `docs/archive/pre-2c/13-2c-i-d/src/components/EventsFeed.tsx`
- Motivo: sin referencias activas detectadas en código.

### `src/components/HockerLiveStatus.tsx`

- Resultado: ARCHIVED
- Destino: `docs/archive/pre-2c/13-2c-i-d/src/components/HockerLiveStatus.tsx`
- Motivo: sin referencias activas detectadas en código.

### `src/components/SystemStatus.tsx`

- Resultado: KEEP
- Motivo: referencias activas detectadas en código.

```text
src/lib/hocker-system-registry-2c.ts:8:export type HockerSystemStatus =
src/lib/hocker-system-registry-2c.ts:19:  status: HockerSystemStatus;
```

### `src/components/NodeBadge.tsx`

- Resultado: ARCHIVED
- Destino: `docs/archive/pre-2c/13-2c-i-d/src/components/NodeBadge.tsx`
- Motivo: sin referencias activas detectadas en código.

### `src/components/AgisRegistry.tsx`

- Resultado: ARCHIVED
- Destino: `docs/archive/pre-2c/13-2c-i-d/src/components/AgisRegistry.tsx`
- Motivo: sin referencias activas detectadas en código.

### `src/components/dashboard/ExternalServicesSection.tsx`

- Resultado: ARCHIVED
- Destino: `docs/archive/pre-2c/13-2c-i-d/src/components/dashboard/ExternalServicesSection.tsx`
- Motivo: sin referencias activas detectadas en código.

### `src/components/dashboard/NovaExecutiveSurface.tsx`

- Resultado: ARCHIVED
- Destino: `docs/archive/pre-2c/13-2c-i-d/src/components/dashboard/NovaExecutiveSurface.tsx`
- Motivo: sin referencias activas detectadas en código.

### `src/lib/nova-executive-language.ts`

- Resultado: ARCHIVED
- Destino: `docs/archive/pre-2c/13-2c-i-d/src/lib/nova-executive-language.ts`
- Motivo: sin referencias activas detectadas en código.

### `src/lib/guards.ts`

- Resultado: ARCHIVED
- Destino: `docs/archive/pre-2c/13-2c-i-d/src/lib/guards.ts`
- Motivo: sin referencias activas detectadas en código.

## Resumen

- Archivados: `13`
- Conservados por referencias activas: `3`
- No encontrados: `0`

## Validación final

- TypeScript: OK.
- Build: OK.
- Archivos eliminados físicamente: NO.
- Legacy archivado con `git mv`: OK.
- Referencias activas protegidas: OK.
