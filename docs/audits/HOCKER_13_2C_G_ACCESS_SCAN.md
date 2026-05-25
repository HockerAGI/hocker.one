# HOCKER ONE · 13-2C-G Access Scan

## Owner routes
src/app/owner/actions/page.tsx
src/app/owner/agis/page.tsx
src/app/owner/apps/page.tsx
src/app/owner/command-center/page.tsx
src/app/owner/ecosystem/page.tsx
src/app/owner/evidence/page.tsx
src/app/owner/layout.tsx
src/app/owner/nova/page.tsx
src/app/owner/page.tsx

## Proxy / Middleware candidates
./middleware.ts
./.next/server/middleware.js
./src/proxy.ts

## Auth / access references
src/app/admin/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
src/app/agis/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
src/app/api/_lib.ts:55:      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
src/app/api/_lib.ts:77:export async function requireProjectRole(project_id: string, allowedRoles: Role[]) {
src/app/api/_lib.ts:84:  } = await sb.auth.getUser();
src/app/api/commands/approve/route.ts:10:  requireProjectRole,
src/app/api/commands/approve/route.ts:54:    const ctx = await requireProjectRole(project_id, ["owner", "admin"]);
src/app/api/commands/reject/route.ts:8:  requireProjectRole,
src/app/api/commands/reject/route.ts:36:    const ctx = await requireProjectRole(project_id, ["owner", "admin"]);
src/app/api/commands/route.ts:15:  requireProjectRole,
src/app/api/commands/route.ts:89:    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);
src/app/api/commands/route.ts:133:    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator"]);
src/app/api/events/manual/route.ts:10:  requireProjectRole,
src/app/api/events/manual/route.ts:49:    const ctx = await requireProjectRole(project_id, [
src/app/api/events/manual/route.ts:107:    const ctx = await requireProjectRole(project_id, ["owner", "admin"]);
src/app/api/governance/killswitch/route.ts:12:  requireProjectRole,
src/app/api/governance/killswitch/route.ts:65:    const ctx = await requireProjectRole(project_id, [
src/app/api/governance/killswitch/route.ts:103:    const ctx = await requireProjectRole(project_id, ["owner", "admin"]);
src/app/api/nova/chat/route.ts:4:import { requireProjectRole } from "@/app/api/_lib";
src/app/api/nova/chat/route.ts:129:    const ctx = await requireProjectRole(parsed.data.project_id, ["owner", "admin", "operator"]);
src/app/api/supply/orders/[id]/route.ts:4:import { ApiError, getControls, json, parseBody, requireProjectRole, toApiError } from "../../../_lib";
src/app/api/supply/orders/[id]/route.ts:47:    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);
src/app/api/supply/orders/[id]/route.ts:102:    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator"]);
src/app/api/supply/orders/route.ts:4:import { getControls, requireProjectRole, ApiError, toApiError, json } from "../../_lib";
src/app/api/supply/orders/route.ts:32:    const { data: { user }, error: authError } = await supabase.auth.getUser();
src/app/api/supply/orders/route.ts:37:    const ctx = await requireProjectRole(payload.project_id, ["owner", "admin", "operator", "viewer"]);
src/app/api/supply/products/[id]/route.ts:2:import { ApiError, getControls, json, parseBody, requireProjectRole, toApiError } from "../../../_lib";
src/app/api/supply/products/[id]/route.ts:43:    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);
src/app/api/supply/products/[id]/route.ts:80:    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator"]);
src/app/api/supply/products/route.ts:2:import { ApiError, json, parseBody, parseQuery, requireProjectRole, toApiError, getControls } from "../../_lib";
src/app/api/supply/products/route.ts:39:    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);
src/app/api/supply/products/route.ts:67:    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator"]);
src/app/api/system/security-readiness/route.ts:3:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
src/app/api/system/security-readiness/route.ts:15:  const ownerGateResponse = requireOwnerOrInternal(req, traceId);
src/app/api/system/security-hardening/route.ts:2:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
src/app/api/system/security-hardening/route.ts:20:    const ownerGateResponse = requireOwnerOrInternal(req);
src/app/api/system/tenant-rls/route.ts:2:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
src/app/api/system/tenant-rls/route.ts:20:    const ownerGateResponse = requireOwnerOrInternal(req);
src/app/api/system/providers/route.ts:1:import { json, parseQuery, requireProjectRole, toApiError } from "@/app/api/_lib";
src/app/api/system/providers/route.ts:14:    const ctx = await requireProjectRole(projectId, ["owner", "admin", "operator", "viewer"]);
src/app/api/system/diagnostics/providers/route.ts:1:import { json, parseQuery, requireProjectRole, toApiError } from "@/app/api/_lib";
src/app/api/system/diagnostics/providers/route.ts:14:    const ctx = await requireProjectRole(projectId, ["owner", "admin", "operator", "viewer"]);
src/app/api/system/nova/always-on/route.ts:1:import { json, parseQuery, requireProjectRole, toApiError } from "@/app/api/_lib";
src/app/api/system/nova/always-on/route.ts:11:    const ctx = await requireProjectRole(projectId, ["owner", "admin", "operator", "viewer"]);
src/app/api/chido/actions/dry-run/route.ts:3:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
src/app/api/chido/actions/dry-run/route.ts:88:  const ownerGateResponse = requireOwnerOrInternal(req, traceId);
src/app/api/chido/actions/approval/request/route.ts:3:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
src/app/api/chido/actions/approval/request/route.ts:51:  const ownerGateResponse = requireOwnerOrInternal(req, traceId);
src/app/api/chido/actions/approval/decision/route.ts:3:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
src/app/api/chido/actions/approval/decision/route.ts:38:  const ownerGateResponse = requireOwnerOrInternal(req, traceId);
src/app/api/chido/actions/signature/check/route.ts:3:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
src/app/api/chido/actions/signature/check/route.ts:68:  const ownerGateResponse = requireOwnerOrInternal(req, traceId);
src/app/api/chido/actions/execution/preflight/route.ts:3:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
src/app/api/chido/actions/execution/preflight/route.ts:69:  const ownerGateResponse = requireOwnerOrInternal(req, traceId);
src/app/api/integrations/register/route.ts:2:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
src/app/api/integrations/register/route.ts:32:  const ownerGateResponse = requireOwnerOrInternal(req, traceId);
src/app/api/integrations/health/route.ts:2:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
src/app/api/integrations/health/route.ts:61:  const ownerGateResponse = requireOwnerOrInternal(req, traceId);
src/app/api/integrations/events/route.ts:2:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
src/app/api/integrations/events/route.ts:39:  const ownerGateResponse = requireOwnerOrInternal(req, traceId);
src/app/api/access/check/route.ts:3:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
src/app/api/access/check/route.ts:38:  const ownerGateResponse = requireOwnerOrInternal(req, traceId);
src/app/api/access/portal-grants/request/route.ts:3:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
src/app/api/access/portal-grants/request/route.ts:39:  const ownerGateResponse = requireOwnerOrInternal(req, traceId);
src/app/api/owner/live-summary/route.ts:3:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
src/app/api/owner/live-summary/route.ts:10:  const gate = requireOwnerOrInternal(req, traceId);
src/app/api/agi/learning/submit/route.ts:3:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
src/app/api/agi/learning/submit/route.ts:12:  const gate = requireOwnerOrInternal(req, traceId);
src/app/api/agi/memory-mirror/route.ts:3:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
src/app/api/agi/memory-mirror/route.ts:10:  const gate = requireOwnerOrInternal(req, traceId);
src/app/api/agi/updates/feed/route.ts:3:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
src/app/api/agi/updates/feed/route.ts:10:  const gate = requireOwnerOrInternal(req, traceId);
src/app/api/agi/runtime/summary/route.ts:2:import { json, requireProjectRole, toApiError } from "@/app/api/_lib";
src/app/api/agi/runtime/summary/route.ts:11:    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);
src/app/api/agi/runtime/actions/route.ts:4:import { json, parseBody, parseQuery, requireProjectRole, toApiError } from "@/app/api/_lib";
src/app/api/agi/runtime/actions/route.ts:40:    const ctx = await requireProjectRole(projectId, ["owner", "admin", "operator", "viewer"]);
src/app/api/agi/runtime/actions/route.ts:60:    const ctx = await requireProjectRole(parsed.project_id, ["owner", "admin", "operator"]);
src/app/api/agi/runtime/actions/decision/route.ts:3:import { json, parseBody, requireProjectRole, toApiError } from "@/app/api/_lib";
src/app/api/agi/runtime/actions/decision/route.ts:18:    const ctx = await requireProjectRole(parsed.project_id, ["owner"]);
src/app/api/agi/runtime/actions/execute/route.ts:3:import { json, parseBody, requireProjectRole, toApiError } from "@/app/api/_lib";
src/app/api/agi/runtime/actions/execute/route.ts:16:    const ctx = await requireProjectRole(parsed.project_id, ["owner"]);
src/app/api/agi/runtime/tools/route.ts:2:import { json, requireProjectRole, toApiError } from "@/app/api/_lib";
src/app/api/agi/runtime/tools/route.ts:14:    await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);
src/app/api/agi/runtime/github/route.ts:2:import { ApiError, json, parseBody, parseQuery, requireProjectRole, toApiError } from "@/app/api/_lib";
src/app/api/agi/runtime/github/route.ts:86:    const ctx = await requireProjectRole(projectId, ["owner", "admin", "operator", "viewer"]);
src/app/api/agi/runtime/github/route.ts:105:    const ctx = await requireProjectRole(parsed.project_id, ["owner", "admin", "operator"]);
src/app/api/agi/runtime/context/route.ts:1:import { json, parseQuery, requireProjectRole, toApiError } from "@/app/api/_lib";
src/app/api/agi/runtime/context/route.ts:11:    const ctx = await requireProjectRole(projectId, ["owner", "admin", "operator", "viewer"]);
src/app/api/agi/runtime/capabilities/route.ts:2:import { json, requireProjectRole, toApiError } from "@/app/api/_lib";
src/app/api/agi/runtime/capabilities/route.ts:19:    await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);
src/app/api/agi/runtime/capabilities/route.ts:39:    await requireProjectRole(parsed.data.project_id, ["owner", "admin", "operator", "viewer"]);
src/app/api/agi/runtime/memory/route.ts:1:import { json, parseQuery, requireProjectRole, toApiError } from "@/app/api/_lib";
src/app/api/agi/runtime/memory/route.ts:11:    const ctx = await requireProjectRole(projectId, ["owner", "admin", "operator", "viewer"]);
src/app/api/agi/runtime/memory/write-gate/route.ts:3:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
src/app/api/agi/runtime/memory/write-gate/route.ts:19:  const gate = requireOwnerOrInternal(req, traceId);
src/app/api/agi/runtime/memory/write-gate/route.ts:45:  const gate = requireOwnerOrInternal(req, traceId);
src/app/api/agi/runtime/memory/review/route.ts:2:import { json, parseBody, parseQuery, requireProjectRole, toApiError } from "@/app/api/_lib";
src/app/api/agi/runtime/memory/review/route.ts:15:    const ctx = await requireProjectRole(projectId, ["owner", "admin", "operator", "viewer"]);
src/app/api/agi/runtime/memory/review/route.ts:35:    const ctx = await requireProjectRole(projectId, ["owner"]);
src/app/api/agi/runtime/memory/publication-audit/route.ts:2:import { json, parseBody, parseQuery, requireProjectRole, toApiError } from "@/app/api/_lib";
src/app/api/agi/runtime/memory/publication-audit/route.ts:17:    const ctx = await requireProjectRole(projectId, ["owner", "admin", "operator", "viewer"]);
src/app/api/agi/runtime/memory/publication-audit/route.ts:37:    const ctx = await requireProjectRole(projectId, ["owner"]);
src/app/chat/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
src/app/commands/page.tsx:21:        <p className="rounded-[28px] border border-white/8 bg-white/[0.035] p-5 text-sm leading-relaxed text-slate-300">Las acciones sensibles deben quedar protegidas por aprobación, owner gate o ejecución bloqueada cuando corresponda.</p>
src/app/commands/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
src/app/dashboard/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
src/app/governance/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
src/app/login/page.tsx:35:      const response = await fetch("/api/auth/password-login", {
src/app/nodes/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
src/app/signout/route.ts:22:    } = await supabase.auth.getUser();
src/app/supply/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
src/app/memory/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
src/app/chido/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
src/app/integrations/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
src/app/status/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
src/app/access/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
src/app/launch/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
src/app/mobile/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
src/app/security/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
src/app/owner/layout.tsx:3:import { requirePrivateSession } from "@/lib/require-private-session";
src/app/apps/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
src/app/servicios/layout.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
src/app/live/page.tsx:2:import { requirePrivateSession } from "@/lib/require-private-session";
src/components/AuthBox.tsx:40:      const response = await fetch("/api/auth/password-login", {
src/lib/supabase-server.ts:2:import { createServerClient } from "@supabase/ssr";
src/lib/supabase-server.ts:7:  return createServerClient(
src/lib/hocker-global-health.ts:428:        note: "Self-call público desactivado para evitar falso HTTP 401 por auth/middleware.",
src/lib/hocker-owner-api-gate.ts:9:export type HockerOwnerGateResult = {
src/lib/hocker-owner-api-gate.ts:56:): HockerOwnerGateResult {
src/lib/hocker-owner-api-gate.ts:68:function blocked(status: number, reason: string): HockerOwnerGateResult {
src/lib/hocker-owner-api-gate.ts:79:export function validateHockerOwnerApiGate(req: NextRequest): HockerOwnerGateResult {
src/lib/hocker-owner-api-gate.ts:109:export function requireOwnerOrInternal(
src/lib/hocker-security-hardening.ts:36:  "/api/access/portal-grants/decision",
src/lib/hocker-security-hardening.ts:37:  "/api/access/portal-grants/revoke",
src/lib/hocker-security-hardening.ts:41:  "/api/access/portal-grants/request",
src/lib/require-private-session.ts:17:  const { data, error } = await supabase.auth.getUser();
src/lib/hocker-agi-canon.ts:179:      "exigir owner gate",
src/lib/hocker-context-pack.ts:57:        objective: "Forzar noindex/nofollow/noarchive en rutas privadas, protegidas y API sin depender únicamente del middleware.",
src/lib/hocker-public-private-topology.ts:64:  "/auth/callback",
src/proxy.ts:2:import { createServerClient } from "@supabase/ssr";
src/proxy.ts:31:export async function proxy(req: NextRequest) {
src/proxy.ts:49:  const supabase = createServerClient(url, anon, {
src/proxy.ts:61:  const { data, error } = await supabase.auth.getUser();
middleware.ts:9:export function middleware(req: NextRequest) {
next.config.js:34:  "/auth/callback",
next.config.js:35:  "/auth/callback/:path*",
