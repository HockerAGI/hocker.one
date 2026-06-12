# HOCKER ONE · 13-2C-H-F-C Owner API Auth Alignment Scan

## Git state
ff8d2ef (HEAD -> nova/phase13-2c-h-f-c-owner-api-auth-audit, tag: stable-hocker-one-phase13-2c-h-f-b-live-route-api-smoke-20260525_174100, origin/main, origin/HEAD, main) Merge pull request #58 from HockerAGI/nova/phase13-2c-h-f-b-live-route-api-smoke
61e60e3 (origin/nova/phase13-2c-h-f-b-live-route-api-smoke, nova/phase13-2c-h-f-b-live-route-api-smoke) docs: add live route api smoke 13-2C-H-F-B
d2995a4 (tag: stable-hocker-one-phase13-2c-h-f-a-nova-inline-flow-smoke-20260525_171135) Merge pull request #57 from HockerAGI/nova/phase13-2c-h-f-a-nova-inline-flow-smoke
324086a (origin/nova/phase13-2c-h-f-a-nova-inline-flow-smoke, nova/phase13-2c-h-f-a-nova-inline-flow-smoke) docs: add nova inline flow smoke 13-2C-H-F-A
321b20b (tag: stable-hocker-one-phase13-2c-h-e-b-rollback-preview-20260525_154512) Merge pull request #56 from HockerAGI/nova/phase13-2c-h-e-b-rollback-preview
73ec702 (origin/nova/phase13-2c-h-e-b-rollback-preview, nova/phase13-2c-h-e-b-rollback-preview) feat: add inline rollback plan preview 13-2C-H-E-B
51f04ff (tag: stable-hocker-one-phase13-2c-h-e-a-rollback-audit-20260525_145640) Merge pull request #55 from HockerAGI/nova/phase13-2c-h-e-a-rollback-audit
04151d0 (origin/nova/phase13-2c-h-e-a-rollback-audit, nova/phase13-2c-h-e-a-rollback-audit) docs: audit rollback endpoint and plan 13-2C-H-E-A
6a93ed0 (tag: stable-hocker-one-phase13-2c-h-d-inline-result-evidence-20260525_134327) Merge pull request #54 from HockerAGI/nova/phase13-2c-h-d-inline-result-evidence
25377a5 (origin/nova/phase13-2c-h-d-inline-result-evidence, nova/phase13-2c-h-d-inline-result-evidence) feat: improve inline execution result evidence 13-2C-H-D
151e6be (tag: stable-hocker-one-phase13-2c-h-c-inline-execute-approved-20260525_123638) Merge pull request #53 from HockerAGI/nova/phase13-2c-h-c-inline-execute-approved
6b6bfc2 (origin/nova/phase13-2c-h-c-inline-execute-approved, nova/phase13-2c-h-c-inline-execute-approved) feat: add inline execution for approved actions 13-2C-H-C
da132c8 (tag: stable-hocker-one-phase13-2c-h-b-nova-inline-approval-20260525_053305) Merge pull request #52 from HockerAGI/nova/phase13-2c-h-b-nova-inline-approval
1d39f46 (origin/nova/phase13-2c-h-b-nova-inline-approval, nova/phase13-2c-h-b-nova-inline-approval) feat: add nova inline approval cards 13-2C-H-B
e69c2e8 (tag: stable-hocker-one-phase13-2c-h-a-owner-gate-schema-audit-20260525_045606) Merge pull request #51 from HockerAGI/nova/phase13-2c-h-a-owner-gate-schema-audit
e742f25 (origin/nova/phase13-2c-h-a-owner-gate-schema-audit, nova/phase13-2c-h-a-owner-gate-schema-audit) docs: audit owner gate schemas 13-2C-H-A

## Owner layout
```tsx
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { requirePrivateSession } from "@/lib/require-private-session";

export const metadata: Metadata = {
  title: {
    default: "Owner | Hocker ONE",
    template: "%s | Owner | Hocker ONE",
  },
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
  },
};

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  await requirePrivateSession();
  return children;
}
```

## Owner NOVA page
```tsx
import type { Metadata } from "next";
import { EvidencePanel } from "@/components/hocker-2c";
import { OwnerShell } from "@/components/hocker-2c/owner";
import { OwnerNovaBridge } from "@/components/hocker-2c/owner/nova";

export const metadata: Metadata = {
  title: "NOVA Owner | Hocker ONE",
  robots: { index: false, follow: false },
};

export default function OwnerNovaPage() {
  return (
    <OwnerShell
      title="NOVA"
      description="La entrada owner para pedir, ordenar, analizar y preparar acciones. Nada real se ejecuta sin aprobación."
      rightPanel={
        <EvidencePanel
          title="Regla owner"
          description="NOVA puede preparar acciones. Lo real requiere aprobación."
          items={[
            { label: "Chat operativo", value: "Activo" },
            { label: "Modos", value: "Normal · Crear · Analizar · Ejecutar" },
            { label: "Ejecución", value: "Con Owner Gate" },
            { label: "Evidencia", value: "Obligatoria" },
          ]}
        />
      }
    >
      <OwnerNovaBridge />
    </OwnerShell>
  );
}
```

## require-private-session
```ts
import "server-only";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";

export const HOCKER_PRIVATE_SESSION_GUARD_VERSION = "hocker-private-session-guard-v0.1.0";

export async function requirePrivateSession() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  if (!url || !anon) {
    redirect("/login");
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/login");
  }

  return data.user;
}
```

## supabase server client
```ts
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function createServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            // Blindaje contra excepciones de solo lectura en Next.js Server Components
            cookieStore.set(name, value, options);
          } catch (error) {
            // Se silencia intencionalmente. El Middleware asume la responsabilidad de la mutación.
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set(name, "", options);
          } catch (error) {
            // Se silencia intencionalmente.
          }
        },
      },
    },
  );
}```

## API shared lib
```ts
import { getErrorMessage } from "@/lib/errors";
import { normalizeNodeId, normalizeProjectId } from "@/lib/project";
import { createServerSupabase } from "@/lib/supabase-server";
import type { ControlRow, JsonObject, NodeRow, Role } from "@/lib/types";
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export const CONTROL_ROW_ID = "global";

export class ApiError extends Error {
  public readonly status: number;
  public readonly payload: { error: string; [key: string]: unknown };
  public readonly body: { error: string; [key: string]: unknown };

  constructor(status: number, payload: { error: string; [key: string]: unknown }) {
    super(payload.error || "Anomalía en el servidor.");
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
    this.body = payload;
  }
}

type ApiBody = Record<string, unknown>;

type ProjectUser = {
  id: string;
  email: string | null;
};

type ProjectRoleRow = {
  role: Role;
};

function isPlainObject(value: unknown): value is ApiBody {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

export function parseQuery(req: Request): URLSearchParams {
  return new URL(req.url).searchParams;
}

export async function parseBody(req: Request): Promise<ApiBody> {
  const raw: unknown = await req.json().catch(() => ({}));
  if (!isPlainObject(raw)) {
    throw new ApiError(400, { error: "Body inválido." });
  }
  return raw;
}

export function json(payload: unknown, status = 200): NextResponse {
  return NextResponse.json(payload, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      "X-Content-Type-Options": "nosniff",
      "X-Hocker-Status": "Nominal",
    },
  });
}

export function toApiError(e: unknown): ApiError {
  if (e instanceof ApiError) return e;

  const status =
    typeof e === "object" && e !== null && "status" in e
      ? Number((e as { status?: unknown }).status) || 500
      : 500;

  return new ApiError(status, {
    error: getErrorMessage(e) || "Error interno en el núcleo de datos.",
  });
}

export async function requireProjectRole(project_id: string, allowedRoles: Role[]) {
  const pid = normalizeProjectId(project_id);
  const sb = await createServerSupabase();

  const {
    data: { user },
    error: userErr,
  } = await sb.auth.getUser();

  if (userErr || !user) {
    throw new ApiError(401, { error: "Identidad no verificada. Acceso denegado." });
  }

  const { data: member, error: roleErr } = await sb
    .from("project_members")
    .select("role")
    .eq("project_id", pid)
    .eq("user_id", user.id)
    .maybeSingle<ProjectRoleRow>();

  if (roleErr) {
    throw new ApiError(500, {
      error: `No se pudo verificar la membresía del proyecto: ${getErrorMessage(roleErr)}`,
    });
  }

  const role = member?.role;

  if (!role || !allowedRoles.includes(role)) {
    throw new ApiError(403, {
      error: "Autoridad insuficiente para ejecutar esta acción.",
      required: allowedRoles,
      current: role ?? "none",
    });
  }

  return {
    sb,
    user: user as ProjectUser,
    project_id: pid,
    role,
  };
}

type NodeUpsertRow = {
  id: string;
  project_id: string;
  name: string;
  type: "cloud" | "agent";
  status: "online" | "offline" | "degraded";
  last_seen_at: string;
  meta: JsonObject;
  tags: string[];
  created_at: string;
  updated_at: string;
};

export async function ensureNode(
  sb: SupabaseClient,
  project_id: string,
  node_id: string,
): Promise<void> {
  const pid = normalizeProjectId(project_id);
  const nid = normalizeNodeId(node_id);
  const now = new Date().toISOString();

  const row: NodeUpsertRow = {
    id: nid,
    project_id: pid,
    name: nid === "hocker-node-1" ? "Nodo Hocker" : `Nodo ${nid}`,
    type: nid.startsWith("cloud-") ? "cloud" : "agent",
    status: "online",
    last_seen_at: now,
    tags: nid === "hocker-node-1" ? ["agent", "core"] : ["agent"],
    meta: {
      source: "control-plane",
      trust: "high",
    },
    created_at: now,
    updated_at: now,
  };

  const { error } = await sb.from("nodes").upsert(row, { onConflict: "id" });

  if (error) {
    throw new ApiError(500, {
      error: `Falla de red al registrar el nodo: ${getErrorMessage(error)}`,
    });
  }
}

export async function getControls(
  sb: SupabaseClient,
  project_id: string,
): Promise<ControlRow> {
  const pid = normalizeProjectId(project_id);
  const now = new Date().toISOString();

  const { data, error } = await sb
    .from("system_controls")
    .select("id,project_id,kill_switch,allow_write,meta,created_at,updated_at")
    .eq("project_id", pid)
    .eq("id", CONTROL_ROW_ID)
    .maybeSingle<ControlRow>();

  if (error) {
    throw new ApiError(500, {
      error: `No se pudo leer la matriz de gobernanza: ${getErrorMessage(error)}`,
    });
  }

  if (data) return data;

  return {
    id: CONTROL_ROW_ID,
    project_id: pid,
    kill_switch: false,
    allow_write: false,
    meta: {},
    created_at: now,
    updated_at: now,
  };
}

export async function upsertControls(
  sb: SupabaseClient,
  next: ControlRow,
): Promise<ControlRow> {
  const { data, error } = await sb
    .from("system_controls")
    .upsert(next, { onConflict: "project_id,id" })
    .select("id,project_id,kill_switch,allow_write,meta,created_at,updated_at")
    .single<ControlRow>();

  if (error || !data) {
    throw new ApiError(500, {
      error: `Falla al actualizar protocolos de gobernanza: ${getErrorMessage(error)}`,
    });
  }

  return data;
}```

## proxy
```ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED_PATHS = [
  "/map",
  "/dashboard",
  "/chat",
  "/commands",
  "/nodes",
  "/agis",
  "/servicios",
  "/apps",
  "/supply",
  "/governance",
  "/memory",
  "/status",
  "/integrations",
  "/access",
  "/launch",
  "/mobile",
  "/security",
  "/owner",
  "/chido",
  "/admin",
];

function isProtected(pathname: string): boolean {
  return PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  const protectedRoute = isProtected(pathname);

  if (!url || !anon) {
    if (protectedRoute) return NextResponse.redirect(new URL("/login", req.url));
    return NextResponse.next();
  }

  const res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          req.cookies.set(name, value);
          res.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.getUser();

  if (error && protectedRoute) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (pathname.startsWith("/login") && data.user) {
    return NextResponse.redirect(new URL("/owner", req.url));
  }

  if (protectedRoute && !data.user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return res;
}

export const config = {
  matcher: [
    "/map",
    "/login",
    "/dashboard",
    "/dashboard/:path*",
    "/chat",
    "/chat/:path*",
    "/commands",
    "/commands/:path*",
    "/nodes",
    "/nodes/:path*",
    "/agis",
    "/agis/:path*",
    "/servicios",
    "/servicios/:path*",
    "/apps",
    "/apps/:path*",
    "/supply",
    "/supply/:path*",
    "/governance",
    "/governance/:path*",
    "/memory",
    "/memory/:path*",
    "/status",
    "/status/:path*",
    "/integrations",
    "/integrations/:path*",
    "/access",
    "/access/:path*",
    "/launch",
    "/launch/:path*",
    "/mobile",
    "/mobile/:path*",
    "/security",
    "/security/:path*",
    "/owner",
    "/owner/:path*",
    "/chido",
    "/chido/:path*",
    "/admin",
    "/admin/:path*",
  ],
};
```

## middleware
```ts
import { NextRequest, NextResponse } from "next/server";
import {
  HOCKER_PRIVATE_TOPOLOGY_HEADER,
  HOCKER_PUBLIC_TOPOLOGY_HEADER,
  isHockerNoindexRoute,
  isHockerPublicRoute,
} from "@/lib/hocker-public-private-topology";

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const pathname = req.nextUrl.pathname;

  const mustNoindex = isHockerNoindexRoute(pathname) || !isHockerPublicRoute(pathname);

  if (mustNoindex) {
    res.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    res.headers.set("X-Hocker-Topology", HOCKER_PRIVATE_TOPOLOGY_HEADER);
  } else {
    res.headers.set("X-Hocker-Topology", HOCKER_PUBLIC_TOPOLOGY_HEADER);
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|brand/|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp|css|js|map|txt|xml|webmanifest)$).*)",
  ],
};
```

## API route auth references
src/app/api/_lib.ts:77:export async function requireProjectRole(project_id: string, allowedRoles: Role[]) {
src/app/api/_lib.ts:78:  const pid = normalizeProjectId(project_id);
src/app/api/_lib.ts:84:  } = await sb.auth.getUser();
src/app/api/_lib.ts:93:    .eq("project_id", pid)
src/app/api/_lib.ts:116:    project_id: pid,
src/app/api/_lib.ts:123:  project_id: string;
src/app/api/_lib.ts:136:  project_id: string,
src/app/api/_lib.ts:139:  const pid = normalizeProjectId(project_id);
src/app/api/_lib.ts:145:    project_id: pid,
src/app/api/_lib.ts:170:  project_id: string,
src/app/api/_lib.ts:172:  const pid = normalizeProjectId(project_id);
src/app/api/_lib.ts:177:    .select("id,project_id,kill_switch,allow_write,meta,created_at,updated_at")
src/app/api/_lib.ts:178:    .eq("project_id", pid)
src/app/api/_lib.ts:192:    project_id: pid,
src/app/api/_lib.ts:207:    .upsert(next, { onConflict: "project_id,id" })
src/app/api/_lib.ts:208:    .select("id,project_id,kill_switch,allow_write,meta,created_at,updated_at")
src/app/api/commands/_cloud.ts:54:  project_id: string;
src/app/api/commands/_cloud.ts:293:    project_id: row.project_id,
src/app/api/commands/_cloud.ts:318:      project_id: row.project_id,
src/app/api/commands/_cloud.ts:334:      row.project_id,
src/app/api/commands/_cloud.ts:352:        project_id: row.project_id,
src/app/api/commands/_cloud.ts:361:        project_id: row.project_id,
src/app/api/commands/_cloud.ts:401:    project_id: row.project_id,
src/app/api/commands/_cloud.ts:416:    project_id: row.project_id,
src/app/api/commands/approve/route.ts:10:  requireProjectRole,
src/app/api/commands/approve/route.ts:43:    const project_id = String(body.project_id ?? body.projectId ?? "").trim();
src/app/api/commands/approve/route.ts:46:    if (!project_id) {
src/app/api/commands/approve/route.ts:47:      throw new ApiError(400, { error: "project_id es obligatorio." });
src/app/api/commands/approve/route.ts:54:    const ctx = await requireProjectRole(project_id, ["owner", "admin"]);
src/app/api/commands/approve/route.ts:55:    const controls = await getControls(ctx.sb, ctx.project_id);
src/app/api/commands/approve/route.ts:64:      .eq("project_id", ctx.project_id)
src/app/api/commands/approve/route.ts:85:        .eq("project_id", ctx.project_id)
src/app/api/commands/approve/route.ts:95:        project_id: ctx.project_id,
src/app/api/commands/approve/route.ts:104:        project_id: ctx.project_id,
src/app/api/commands/approve/route.ts:131:      project_id: string;
src/app/api/commands/approve/route.ts:144:      commandRow.project_id,
src/app/api/commands/approve/route.ts:161:      .eq("project_id", ctx.project_id)
src/app/api/commands/approve/route.ts:171:      project_id: ctx.project_id,
src/app/api/commands/approve/route.ts:180:      project_id: ctx.project_id,
src/app/api/commands/approve/route.ts:209:          Authorization: `Bearer ${internalSecret}`,
src/app/api/commands/approve/route.ts:222:          projectId: ctx.project_id,
src/app/api/commands/reject/route.ts:8:  requireProjectRole,
src/app/api/commands/reject/route.ts:25:    const project_id = String(body.project_id ?? body.projectId ?? "").trim();
src/app/api/commands/reject/route.ts:28:    if (!project_id) {
src/app/api/commands/reject/route.ts:29:      throw new ApiError(400, { error: "project_id es obligatorio." });
src/app/api/commands/reject/route.ts:36:    const ctx = await requireProjectRole(project_id, ["owner", "admin"]);
src/app/api/commands/reject/route.ts:37:    const controls = await getControls(ctx.sb, ctx.project_id);
src/app/api/commands/reject/route.ts:46:      .eq("project_id", ctx.project_id)
src/app/api/commands/reject/route.ts:66:      .eq("project_id", ctx.project_id)
src/app/api/commands/reject/route.ts:76:      project_id: ctx.project_id,
src/app/api/commands/reject/route.ts:85:      project_id: ctx.project_id,
src/app/api/commands/route.ts:15:  requireProjectRole,
src/app/api/commands/route.ts:49:  | "project_id"
src/app/api/commands/route.ts:69:      Authorization: `Bearer ${internalSecret}`,
src/app/api/commands/route.ts:83:    const project_id = String(url.searchParams.get("project_id") ?? url.searchParams.get("projectId") ?? "").trim();
src/app/api/commands/route.ts:85:    if (!project_id) {
src/app/api/commands/route.ts:86:      throw new ApiError(400, { error: "project_id es obligatorio." });
src/app/api/commands/route.ts:89:    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);
src/app/api/commands/route.ts:94:      .eq("project_id", ctx.project_id)
src/app/api/commands/route.ts:118:    const project_id = String(body.project_id ?? body.projectId ?? "").trim();
src/app/api/commands/route.ts:119:    if (!project_id) {
src/app/api/commands/route.ts:120:      throw new ApiError(400, { error: "project_id es obligatorio." });
src/app/api/commands/route.ts:133:    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator"]);
src/app/api/commands/route.ts:134:    const controls = await getControls(ctx.sb, ctx.project_id);
src/app/api/commands/route.ts:161:    await ensureNode(ctx.sb, ctx.project_id, node_id);
src/app/api/commands/route.ts:166:      ctx.project_id,
src/app/api/commands/route.ts:175:      project_id: ctx.project_id,
src/app/api/commands/route.ts:198:      project_id: ctx.project_id,
src/app/api/commands/route.ts:212:      project_id: ctx.project_id,
src/app/api/commands/route.ts:248:            projectId: ctx.project_id,
src/app/api/events/manual/route.ts:10:  requireProjectRole,
src/app/api/events/manual/route.ts:43:    const project_id = String(q.get("project_id") ?? "").trim();
src/app/api/events/manual/route.ts:45:    if (!project_id) {
src/app/api/events/manual/route.ts:46:      throw new ApiError(400, { error: "project_id es obligatorio." });
src/app/api/events/manual/route.ts:49:    const ctx = await requireProjectRole(project_id, [
src/app/api/events/manual/route.ts:56:    trace.update({ userId: ctx.user.id, tags: [project_id, "radar_read"] });
src/app/api/events/manual/route.ts:60:      .select("id, project_id, node_id, level, type, message, data, created_at")
src/app/api/events/manual/route.ts:61:      .eq("project_id", ctx.project_id)
src/app/api/events/manual/route.ts:93:    const project_id = String(body.project_id ?? "").trim();
src/app/api/events/manual/route.ts:97:    if (!project_id) {
src/app/api/events/manual/route.ts:98:      throw new ApiError(400, { error: "project_id es obligatorio." });
src/app/api/events/manual/route.ts:107:    const ctx = await requireProjectRole(project_id, ["owner", "admin"]);
src/app/api/events/manual/route.ts:108:    trace.update({ userId: ctx.user.id, tags: [project_id, "manual_event"] });
src/app/api/events/manual/route.ts:111:      await ensureNode(ctx.sb, ctx.project_id, node_id);
src/app/api/events/manual/route.ts:117:        project_id: ctx.project_id,
src/app/api/events/manual/route.ts:124:      .select("id, project_id, node_id, level, type, message, data, created_at")
src/app/api/execute/route.ts:12:  project_id?: unknown;
src/app/api/execute/route.ts:23:  if (typeof body.project_id === "string" && body.project_id.trim()) return body.project_id.trim();
src/app/api/execute/route.ts:29:  return auth.replace(/^Bearer\s+/i, "").trim();
src/app/api/governance/killswitch/route.ts:12:  requireProjectRole,
src/app/api/governance/killswitch/route.ts:40:async function loadControls(sb: SupabaseClient, project_id: string): Promise<ControlRow> {
src/app/api/governance/killswitch/route.ts:41:  const row = await getControls(sb, project_id);
src/app/api/governance/killswitch/route.ts:59:    const project_id = String(q.get("project_id") ?? "").trim();
src/app/api/governance/killswitch/route.ts:61:    if (!project_id) {
src/app/api/governance/killswitch/route.ts:62:      throw new ApiError(400, { error: "project_id es obligatorio." });
src/app/api/governance/killswitch/route.ts:65:    const ctx = await requireProjectRole(project_id, [
src/app/api/governance/killswitch/route.ts:72:    trace.update({ userId: ctx.user.id, tags: [project_id, "governance_read"] });
src/app/api/governance/killswitch/route.ts:74:    const controls = await loadControls(ctx.sb, ctx.project_id);
src/app/api/governance/killswitch/route.ts:97:    const project_id = String(body.project_id ?? "").trim();
src/app/api/governance/killswitch/route.ts:99:    if (!project_id) {
src/app/api/governance/killswitch/route.ts:100:      throw new ApiError(400, { error: "project_id es obligatorio." });
src/app/api/governance/killswitch/route.ts:103:    const ctx = await requireProjectRole(project_id, ["owner", "admin"]);
src/app/api/governance/killswitch/route.ts:104:    trace.update({ userId: ctx.user.id, tags: [project_id, "governance_write"] });
src/app/api/governance/killswitch/route.ts:108:      project_id: ctx.project_id,
src/app/api/nova/chat/route.ts:4:import { requireProjectRole } from "@/app/api/_lib";
src/app/api/nova/chat/route.ts:14:  project_id: z.string().min(1).default(process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one"),
src/app/api/nova/chat/route.ts:27:  project_id?: string;
src/app/api/nova/chat/route.ts:68:    project_id: payload.project_id,
src/app/api/nova/chat/route.ts:115:  const queueLock = await getAgiQueueLock(parsed.data.project_id);
src/app/api/nova/chat/route.ts:117:  const capabilitiesContract = buildNovaChatCapabilitiesContext(parsed.data.message, parsed.data.project_id);
src/app/api/nova/chat/route.ts:123:    project_id: parsed.data.project_id,
src/app/api/nova/chat/route.ts:129:    const ctx = await requireProjectRole(parsed.data.project_id, ["owner", "admin", "operator"]);
src/app/api/nova/chat/route.ts:131:      project_id: ctx.project_id,
src/app/api/nova/chat/route.ts:149:      project_id: parsed.data.project_id,
src/app/api/nova/chat/route.ts:185:        project_id: parsed.data.project_id,
src/app/api/nova/chat/route.ts:230:        Authorization: `Bearer ${key}`,
src/app/api/nova/chat/stream/route.ts:11:  project_id: z.string().min(1).default(process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one"),
src/app/api/nova/chat/stream/route.ts:44:  const capabilitiesContract = buildNovaChatCapabilitiesContext(String(body.message ?? ""), body.project_id);
src/app/api/nova/chat/stream/route.ts:86:      Authorization: `Bearer ${key}`,
src/app/api/nova/chat/stream/route.ts:131:  const queueLock = await getAgiQueueLock(parsed.data.project_id);
src/app/api/nova/chat/stream/route.ts:148:          const capabilitiesContract = buildNovaChatCapabilitiesContext(parsed.data.message, parsed.data.project_id);
src/app/api/nova/chat/stream/route.ts:166:            Authorization: `Bearer ${key}`,
src/app/api/orchestrator/cron/route.ts:18:  if (auth !== `Bearer ${cronSecret}`) {
src/app/api/orchestrator/cron/route.ts:37:        Authorization: `Bearer ${cronSecret}`,
src/app/api/orchestrator/run/route.ts:21:  if (!internalSecret || authHeader !== `Bearer ${internalSecret}`) {
src/app/api/orchestrator/run/route.ts:33:      .select("id, project_id, node_id")
src/app/api/orchestrator/run/route.ts:48:    const executionPromises = commands.map((cmd) => executeCommand(cmd.id, cmd.project_id));
src/app/api/supply/orders/[id]/route.ts:4:import { ApiError, getControls, json, parseBody, requireProjectRole, toApiError } from "../../../_lib";
src/app/api/supply/orders/[id]/route.ts:41:    const project_id = String(url.searchParams.get("project_id") ?? "").trim();
src/app/api/supply/orders/[id]/route.ts:43:    if (!project_id) {
src/app/api/supply/orders/[id]/route.ts:44:      throw new ApiError(400, { error: "project_id es obligatorio." });
src/app/api/supply/orders/[id]/route.ts:47:    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);
src/app/api/supply/orders/[id]/route.ts:48:    trace.update({ userId: ctx.user.id, tags: [project_id, "logistica", "auditoria"] });
src/app/api/supply/orders/[id]/route.ts:53:      .eq("project_id", ctx.project_id)
src/app/api/supply/orders/[id]/route.ts:96:    const project_id = String(body.project_id ?? "").trim();
src/app/api/supply/orders/[id]/route.ts:98:    if (!project_id) {
src/app/api/supply/orders/[id]/route.ts:99:      throw new ApiError(400, { error: "project_id es obligatorio." });
src/app/api/supply/orders/[id]/route.ts:102:    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator"]);
src/app/api/supply/orders/[id]/route.ts:103:    trace.update({ userId: ctx.user.id, tags: [project_id, "finance", "logistica"] });
src/app/api/supply/orders/[id]/route.ts:105:    const controls = await getControls(ctx.sb, ctx.project_id);
src/app/api/supply/orders/[id]/route.ts:151:      .eq("project_id", ctx.project_id)
src/app/api/supply/orders/route.ts:4:import { getControls, requireProjectRole, ApiError, toApiError, json } from "../../_lib";
src/app/api/supply/orders/route.ts:10:  project_id: z.string().min(1),
src/app/api/supply/orders/route.ts:32:    const { data: { user }, error: authError } = await supabase.auth.getUser();
src/app/api/supply/orders/route.ts:37:    const ctx = await requireProjectRole(payload.project_id, ["owner", "admin", "operator", "viewer"]);
src/app/api/supply/orders/route.ts:38:    const controls = await getControls(ctx.sb, ctx.project_id);
src/app/api/supply/orders/route.ts:51:      .eq("project_id", ctx.project_id)
src/app/api/supply/orders/route.ts:65:        project_id: ctx.project_id,
src/app/api/supply/products/[id]/route.ts:2:import { ApiError, getControls, json, parseBody, requireProjectRole, toApiError } from "../../../_lib";
src/app/api/supply/products/[id]/route.ts:37:    const project_id = String(url.searchParams.get("project_id") ?? "").trim();
src/app/api/supply/products/[id]/route.ts:39:    if (!project_id) {
src/app/api/supply/products/[id]/route.ts:40:      throw new ApiError(400, { error: "project_id es obligatorio." });
src/app/api/supply/products/[id]/route.ts:43:    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);
src/app/api/supply/products/[id]/route.ts:48:      .eq("project_id", ctx.project_id)
src/app/api/supply/products/[id]/route.ts:74:    const project_id = String(body.project_id ?? "").trim();
src/app/api/supply/products/[id]/route.ts:76:    if (!project_id) {
src/app/api/supply/products/[id]/route.ts:77:      throw new ApiError(400, { error: "project_id es obligatorio." });
src/app/api/supply/products/[id]/route.ts:80:    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator"]);
src/app/api/supply/products/[id]/route.ts:81:    const controls = await getControls(ctx.sb, ctx.project_id);
src/app/api/supply/products/[id]/route.ts:138:      .eq("project_id", ctx.project_id)
src/app/api/supply/products/route.ts:2:import { ApiError, json, parseBody, parseQuery, requireProjectRole, toApiError, getControls } from "../../_lib";
src/app/api/supply/products/route.ts:33:    const project_id = String(q.get("project_id") ?? "").trim();
src/app/api/supply/products/route.ts:35:    if (!project_id) {
src/app/api/supply/products/route.ts:36:      throw new ApiError(400, { error: "project_id es obligatorio." });
src/app/api/supply/products/route.ts:39:    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);
src/app/api/supply/products/route.ts:43:      .select("id, project_id, sku, name, description, price_cents, cost_cents, currency, stock, active, meta, created_at, updated_at")
src/app/api/supply/products/route.ts:44:      .eq("project_id", ctx.project_id)
src/app/api/supply/products/route.ts:61:    const project_id = String(body.project_id ?? "").trim();
src/app/api/supply/products/route.ts:63:    if (!project_id) {
src/app/api/supply/products/route.ts:64:      throw new ApiError(400, { error: "project_id es obligatorio." });
src/app/api/supply/products/route.ts:67:    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator"]);
src/app/api/supply/products/route.ts:68:    const controls = await getControls(ctx.sb, ctx.project_id);
src/app/api/supply/products/route.ts:95:        project_id: ctx.project_id,
src/app/api/system/status/route.ts:16:  project_id?: string;
src/app/api/system/status/route.ts:79:    authorization: `Bearer ${anon}`,
src/app/api/system/status/route.ts:102:  const headers: HeadersInit = key ? { authorization: `Bearer ${key}` } : {};
src/app/api/system/status/route.ts:150:    project_id: `eq.${projectId}`,
src/app/api/system/status/route.ts:151:    select: "id,project_id,status,last_seen_at,updated_at",
src/app/api/system/status/route.ts:163:        authorization: `Bearer ${serviceKey}`,
src/app/api/system/security-readiness/route.ts:3:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
src/app/api/system/security-readiness/route.ts:15:  const ownerGateResponse = requireOwnerOrInternal(req, traceId);
src/app/api/system/security-readiness/route.ts:29:          project_id: "hocker-one",
src/app/api/system/security-hardening/route.ts:2:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
src/app/api/system/security-hardening/route.ts:20:    const ownerGateResponse = requireOwnerOrInternal(req);
src/app/api/system/security-hardening/route.ts:29:          project_id: "hocker-one",
src/app/api/system/tenant-rls/route.ts:2:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
src/app/api/system/tenant-rls/route.ts:20:    const ownerGateResponse = requireOwnerOrInternal(req);
src/app/api/system/tenant-rls/route.ts:29:          project_id: "hocker-one",
src/app/api/system/providers/route.ts:1:import { json, parseQuery, requireProjectRole, toApiError } from "@/app/api/_lib";
src/app/api/system/providers/route.ts:13:    const projectId = query.get("project_id") || process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one";
src/app/api/system/providers/route.ts:14:    const ctx = await requireProjectRole(projectId, ["owner", "admin", "operator", "viewer"]);
src/app/api/system/providers/route.ts:18:      project_id: ctx.project_id,
src/app/api/system/providers/route.ts:20:      inventory: await getHockerUnifiedProviderInventory(ctx.project_id),
src/app/api/system/diagnostics/providers/route.ts:1:import { json, parseQuery, requireProjectRole, toApiError } from "@/app/api/_lib";
src/app/api/system/diagnostics/providers/route.ts:13:    const projectId = query.get("project_id") || process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one";
src/app/api/system/diagnostics/providers/route.ts:14:    const ctx = await requireProjectRole(projectId, ["owner", "admin", "operator", "viewer"]);
src/app/api/system/diagnostics/providers/route.ts:18:      project_id: ctx.project_id,
src/app/api/system/nova/always-on/route.ts:1:import { json, parseQuery, requireProjectRole, toApiError } from "@/app/api/_lib";
src/app/api/system/nova/always-on/route.ts:10:    const projectId = query.get("project_id") || process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one";
src/app/api/system/nova/always-on/route.ts:11:    const ctx = await requireProjectRole(projectId, ["owner", "admin", "operator", "viewer"]);
src/app/api/system/nova/always-on/route.ts:15:      project_id: ctx.project_id,
src/app/api/chido/actions/dry-run/route.ts:3:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
src/app/api/chido/actions/dry-run/route.ts:70:      project_id: "chido-casino",
src/app/api/chido/actions/dry-run/route.ts:88:  const ownerGateResponse = requireOwnerOrInternal(req, traceId);
src/app/api/chido/actions/approval/request/route.ts:3:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
src/app/api/chido/actions/approval/request/route.ts:51:  const ownerGateResponse = requireOwnerOrInternal(req, traceId);
src/app/api/chido/actions/approval/request/route.ts:128:      project_id: "chido-casino",
src/app/api/chido/actions/approval/decision/route.ts:3:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
src/app/api/chido/actions/approval/decision/route.ts:38:  const ownerGateResponse = requireOwnerOrInternal(req, traceId);
src/app/api/chido/actions/approval/decision/route.ts:83:    .eq("project_id", "chido-casino")
src/app/api/chido/actions/approval/decision/route.ts:151:    .eq("project_id", "chido-casino")
src/app/api/chido/actions/approval/decision/route.ts:191:      project_id: "chido-casino",
src/app/api/chido/actions/signature/check/route.ts:3:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
src/app/api/chido/actions/signature/check/route.ts:50:      project_id: "chido-casino",
src/app/api/chido/actions/signature/check/route.ts:68:  const ownerGateResponse = requireOwnerOrInternal(req, traceId);
src/app/api/chido/actions/signature/check/route.ts:122:    .eq("project_id", "chido-casino")
src/app/api/chido/actions/signature/check/route.ts:169:    .eq("project_id", "chido-casino")
src/app/api/chido/actions/execution/preflight/route.ts:3:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
src/app/api/chido/actions/execution/preflight/route.ts:52:      project_id: "chido-casino",
src/app/api/chido/actions/execution/preflight/route.ts:69:  const ownerGateResponse = requireOwnerOrInternal(req, traceId);
src/app/api/chido/actions/execution/preflight/route.ts:94:    .eq("project_id", "chido-casino")
src/app/api/chido/actions/execution/preflight/route.ts:180:    .eq("project_id", "chido-casino")
src/app/api/chido/actions/execution/preflight/route.ts:223:    .eq("project_id", "chido-casino")
src/app/api/integrations/register/route.ts:2:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
src/app/api/integrations/register/route.ts:32:  const ownerGateResponse = requireOwnerOrInternal(req, traceId);
src/app/api/integrations/register/route.ts:65:      project_id: "hocker-one",
src/app/api/integrations/health/route.ts:2:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
src/app/api/integrations/health/route.ts:61:  const ownerGateResponse = requireOwnerOrInternal(req, traceId);
src/app/api/integrations/health/route.ts:106:        project_id: "hocker-one",
src/app/api/integrations/events/route.ts:2:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
src/app/api/integrations/events/route.ts:39:  const ownerGateResponse = requireOwnerOrInternal(req, traceId);
src/app/api/integrations/events/route.ts:75:      project_id: "hocker-one",
src/app/api/access/check/route.ts:3:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
src/app/api/access/check/route.ts:38:  const ownerGateResponse = requireOwnerOrInternal(req, traceId);
src/app/api/access/check/route.ts:87:        project_id: "hocker-one",
src/app/api/access/portal-grants/request/route.ts:3:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
src/app/api/access/portal-grants/request/route.ts:39:  const ownerGateResponse = requireOwnerOrInternal(req, traceId);
src/app/api/access/portal-grants/request/route.ts:98:        project_id: "hocker-one",
src/app/api/access/portal-grants/decision/route.ts:65:    .eq("project_id", "hocker-one")
src/app/api/access/portal-grants/decision/route.ts:156:      project_id: "hocker-one",
src/app/api/access/portal-grants/revoke/route.ts:60:    .eq("project_id", "hocker-one")
src/app/api/access/portal-grants/revoke/route.ts:103:      project_id: "hocker-one",
src/app/api/owner/live-summary/route.ts:3:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
src/app/api/owner/live-summary/route.ts:10:  const gate = requireOwnerOrInternal(req, traceId);
src/app/api/agi/learning/submit/route.ts:3:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
src/app/api/agi/learning/submit/route.ts:12:  const gate = requireOwnerOrInternal(req, traceId);
src/app/api/agi/learning/submit/route.ts:16:  const projectId = text(input.project_id, "hocker-one", 80);
src/app/api/agi/learning/submit/route.ts:44:  const { data: existing, error: existingError } = await db.from("agi_learning_events").select("id,times_seen,status").eq("project_id", projectId).eq("source_hash", sourceHash).maybeSingle();
src/app/api/agi/learning/submit/route.ts:60:      .eq("project_id", projectId)
src/app/api/agi/learning/submit/route.ts:76:      .eq("project_id", projectId)
src/app/api/agi/learning/submit/route.ts:140:    project_id: projectId, source_agi_id: sourceAgiId, source_agi_name: agiName(sourceAgiId), source_module: optText(input.source_module, 160),
src/app/api/agi/memory-mirror/route.ts:3:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
src/app/api/agi/memory-mirror/route.ts:10:  const gate = requireOwnerOrInternal(req, traceId);
src/app/api/agi/memory-mirror/route.ts:14:  const projectId = text(url.searchParams.get("project_id"), "hocker-one", 80);
src/app/api/agi/memory-mirror/route.ts:21:  let query = sb().from("agi_memory_mirror").select(memorySelect).eq("project_id", projectId).order("created_at", { ascending: false }).limit(limit(url.searchParams.get("limit"), 30, 100));
src/app/api/agi/memory-mirror/route.ts:30:  return NextResponse.json({ ok: true, trace_id: traceId, project_id: projectId, agi_id: agiId, count: data?.length || 0, memory: data || [], version: HOCKER_MEMORY_MIRROR_API_VERSION });
src/app/api/agi/updates/feed/route.ts:3:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
src/app/api/agi/updates/feed/route.ts:10:  const gate = requireOwnerOrInternal(req, traceId);
src/app/api/agi/updates/feed/route.ts:14:  const projectId = text(url.searchParams.get("project_id"), "hocker-one", 80);
src/app/api/agi/updates/feed/route.ts:23:  let query = sb().from("agi_update_feed").select(feedSelect).eq("project_id", projectId).eq("agi_id", agiId).order("created_at", { ascending: false }).limit(limit(url.searchParams.get("limit"), 30, 100));
src/app/api/agi/updates/feed/route.ts:31:  return NextResponse.json({ ok: true, trace_id: traceId, project_id: projectId, agi_id: agiId, count: data?.length || 0, feed: data || [], version: HOCKER_MEMORY_MIRROR_API_VERSION });
src/app/api/agi/runtime/summary/route.ts:2:import { json, requireProjectRole, toApiError } from "@/app/api/_lib";
src/app/api/agi/runtime/summary/route.ts:10:    const project_id = String(url.searchParams.get("project_id") || process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one").trim();
src/app/api/agi/runtime/summary/route.ts:11:    const ctx = await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);
src/app/api/agi/runtime/summary/route.ts:12:    const summary = await getAgiRuntimeSummary(ctx.project_id);
src/app/api/agi/runtime/actions/route.ts:4:import { json, parseBody, parseQuery, requireProjectRole, toApiError } from "@/app/api/_lib";
src/app/api/agi/runtime/actions/route.ts:10:  project_id: string;
src/app/api/agi/runtime/actions/route.ts:22:  project_id: z.string().min(1).default(process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one"),
src/app/api/agi/runtime/actions/route.ts:36:    const projectId = query.get("project_id") || process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one";
src/app/api/agi/runtime/actions/route.ts:40:    const ctx = await requireProjectRole(projectId, ["owner", "admin", "operator", "viewer"]);
src/app/api/agi/runtime/actions/route.ts:41:    const actions = await listAgiActions({ project_id: ctx.project_id, status, tool_key: toolKey, limit });
src/app/api/agi/runtime/actions/route.ts:45:      project_id: ctx.project_id,
src/app/api/agi/runtime/actions/route.ts:60:    const ctx = await requireProjectRole(parsed.project_id, ["owner", "admin", "operator"]);
src/app/api/agi/runtime/actions/route.ts:63:      project_id: ctx.project_id,
src/app/api/agi/runtime/actions/decision/route.ts:3:import { json, parseBody, requireProjectRole, toApiError } from "@/app/api/_lib";
src/app/api/agi/runtime/actions/decision/route.ts:9:  project_id: z.string().min(1).default(process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one"),
src/app/api/agi/runtime/actions/decision/route.ts:18:    const ctx = await requireProjectRole(parsed.project_id, ["owner"]);
src/app/api/agi/runtime/actions/decision/route.ts:20:      project_id: ctx.project_id,
src/app/api/agi/runtime/actions/execute/route.ts:3:import { json, parseBody, requireProjectRole, toApiError } from "@/app/api/_lib";
src/app/api/agi/runtime/actions/execute/route.ts:9:  project_id: z.string().min(1).default(process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one"),
src/app/api/agi/runtime/actions/execute/route.ts:16:    const ctx = await requireProjectRole(parsed.project_id, ["owner"]);
src/app/api/agi/runtime/actions/execute/route.ts:17:    const item = await executeApprovedAgiAction({ project_id: ctx.project_id, action_id: parsed.action_id, actor_id: ctx.user.id });
src/app/api/agi/runtime/tools/route.ts:2:import { json, requireProjectRole, toApiError } from "@/app/api/_lib";
src/app/api/agi/runtime/tools/route.ts:10:    const project_id = String(
src/app/api/agi/runtime/tools/route.ts:11:      url.searchParams.get("project_id") || process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one",
src/app/api/agi/runtime/tools/route.ts:14:    await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);
src/app/api/agi/runtime/tools/route.ts:28:      project_id,
src/app/api/agi/runtime/github/route.ts:2:import { ApiError, json, parseBody, parseQuery, requireProjectRole, toApiError } from "@/app/api/_lib";
src/app/api/agi/runtime/github/route.ts:29:  project_id: z.string().min(1).default(process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one"),
src/app/api/agi/runtime/github/route.ts:85:    const projectId = query.get("project_id") || process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one";
src/app/api/agi/runtime/github/route.ts:86:    const ctx = await requireProjectRole(projectId, ["owner", "admin", "operator", "viewer"]);
src/app/api/agi/runtime/github/route.ts:90:      project_id: ctx.project_id,
src/app/api/agi/runtime/github/route.ts:105:    const ctx = await requireProjectRole(parsed.project_id, ["owner", "admin", "operator"]);
src/app/api/agi/runtime/github/route.ts:144:        project_id: ctx.project_id,
src/app/api/agi/runtime/github/route.ts:166:          project_id: ctx.project_id,
src/app/api/agi/runtime/github/route.ts:193:      project_id: ctx.project_id,
src/app/api/agi/runtime/context/route.ts:1:import { json, parseQuery, requireProjectRole, toApiError } from "@/app/api/_lib";
src/app/api/agi/runtime/context/route.ts:10:    const projectId = query.get("project_id") || process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one";
src/app/api/agi/runtime/context/route.ts:11:    const ctx = await requireProjectRole(projectId, ["owner", "admin", "operator", "viewer"]);
src/app/api/agi/runtime/context/route.ts:12:    return json({ ...(await getHockerContinuityContextPackWithMemory(ctx.project_id)), project_id: ctx.project_id });
src/app/api/agi/runtime/capabilities/route.ts:2:import { json, requireProjectRole, toApiError } from "@/app/api/_lib";
src/app/api/agi/runtime/capabilities/route.ts:10:  project_id: z.string().min(1).default(process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one"),
src/app/api/agi/runtime/capabilities/route.ts:17:    const project_id = String(url.searchParams.get("project_id") || process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one").trim();
src/app/api/agi/runtime/capabilities/route.ts:19:    await requireProjectRole(project_id, ["owner", "admin", "operator", "viewer"]);
src/app/api/agi/runtime/capabilities/route.ts:22:      ...getHockerCapabilitiesContract(project_id),
src/app/api/agi/runtime/capabilities/route.ts:39:    await requireProjectRole(parsed.data.project_id, ["owner", "admin", "operator", "viewer"]);
src/app/api/agi/runtime/capabilities/route.ts:41:    const contract = getHockerCapabilitiesContract(parsed.data.project_id);
src/app/api/agi/runtime/capabilities/route.ts:45:      project_id: parsed.data.project_id,
src/app/api/agi/runtime/memory/route.ts:1:import { json, parseQuery, requireProjectRole, toApiError } from "@/app/api/_lib";
src/app/api/agi/runtime/memory/route.ts:10:    const projectId = query.get("project_id") || process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one";
src/app/api/agi/runtime/memory/route.ts:11:    const ctx = await requireProjectRole(projectId, ["owner", "admin", "operator", "viewer"]);
src/app/api/agi/runtime/memory/route.ts:12:    const snapshot = await getSyntiaOperationalMemorySnapshot(ctx.project_id);
src/app/api/agi/runtime/memory/write-gate/route.ts:3:import { requireOwnerOrInternal } from "@/lib/hocker-owner-api-gate";
src/app/api/agi/runtime/memory/write-gate/route.ts:19:  const gate = requireOwnerOrInternal(req, traceId);
src/app/api/agi/runtime/memory/write-gate/route.ts:28:        project_id: url.searchParams.get("project_id") || "hocker-one",
src/app/api/agi/runtime/memory/write-gate/route.ts:45:  const gate = requireOwnerOrInternal(req, traceId);
src/app/api/agi/runtime/memory/review/route.ts:2:import { json, parseBody, parseQuery, requireProjectRole, toApiError } from "@/app/api/_lib";
src/app/api/agi/runtime/memory/review/route.ts:14:    const projectId = query.get("project_id") || "hocker-one";
src/app/api/agi/runtime/memory/review/route.ts:15:    const ctx = await requireProjectRole(projectId, ["owner", "admin", "operator", "viewer"]);
src/app/api/agi/runtime/memory/review/route.ts:16:    const snapshot = await listSyntiaMemoryReviewQueue(ctx.project_id, Number(query.get("limit") || 50));
src/app/api/agi/runtime/memory/review/route.ts:34:    const projectId = String(input.project_id || "hocker-one");
src/app/api/agi/runtime/memory/review/route.ts:35:    const ctx = await requireProjectRole(projectId, ["owner"]);
src/app/api/agi/runtime/memory/review/route.ts:40:      return json(await listSyntiaMemoryReviewQueue(ctx.project_id));
src/app/api/agi/runtime/memory/review/route.ts:57:      { ...input, project_id: ctx.project_id },
src/app/api/agi/runtime/memory/publication-audit/route.ts:2:import { json, parseBody, parseQuery, requireProjectRole, toApiError } from "@/app/api/_lib";
src/app/api/agi/runtime/memory/publication-audit/route.ts:16:    const projectId = query.get("project_id") || "hocker-one";
src/app/api/agi/runtime/memory/publication-audit/route.ts:17:    const ctx = await requireProjectRole(projectId, ["owner", "admin", "operator", "viewer"]);
src/app/api/agi/runtime/memory/publication-audit/route.ts:18:    const snapshot = await listSyntiaMemoryPublicationAudit(ctx.project_id, Number(query.get("limit") || 50));
src/app/api/agi/runtime/memory/publication-audit/route.ts:36:    const projectId = String(input.project_id || "hocker-one");
src/app/api/agi/runtime/memory/publication-audit/route.ts:37:    const ctx = await requireProjectRole(projectId, ["owner"]);
src/app/api/agi/runtime/memory/publication-audit/route.ts:42:      return json(await listSyntiaMemoryPublicationAudit(ctx.project_id));
src/app/api/agi/runtime/memory/publication-audit/route.ts:46:      return json(await buildSyntiaPublicationDiff({ ...input, project_id: ctx.project_id }));
src/app/api/agi/runtime/memory/publication-audit/route.ts:50:      return json(await previewSyntiaPublishedMemoryRollback({ ...input, project_id: ctx.project_id }));
src/app/api/agi/runtime/memory/publication-audit/route.ts:55:        { ...input, project_id: ctx.project_id },
src/lib/audit-chain.ts:9:  project_id: string | null;
src/lib/audit-chain.ts:17:  project_id: string;
src/lib/audit-chain.ts:49:    project_id: row.project_id,
src/lib/audit-chain.ts:63:    project_id: row.project_id ?? "",
src/lib/audit-chain.ts:83:    project_id: row.project_id ?? "",
src/lib/audit-chain.ts:104:async function loadAuditRows(project_id: string, limit = 5000): Promise<AuditDbRow[]> {
src/lib/audit-chain.ts:109:    .select("id, project_id, actor_user_id, action, context, created_at")
src/lib/audit-chain.ts:110:    .eq("project_id", project_id)
src/lib/audit-chain.ts:123:  project_id: string;
src/lib/audit-chain.ts:134:      project_id: args.project_id,
src/lib/audit-chain.ts:140:    .select("id, project_id, actor_user_id, action, context, created_at")
src/lib/audit-chain.ts:147:  const rows = await loadAuditRows(args.project_id, 5000);
src/lib/audit-chain.ts:164:  project_id: string;
src/lib/audit-chain.ts:176:    project_id: args.project_id,
src/lib/audit-chain.ts:193:export async function createAuditFingerprint(project_id: string): Promise<AuditFingerprintResult> {
src/lib/audit-chain.ts:194:  const rows = await loadAuditRows(project_id, 5000);
src/lib/audit-chain.ts:206:    project_id,
src/lib/audit-chain.ts:215:  project_id: string,
src/lib/audit-chain.ts:218:  const rows = await loadAuditRows(project_id, limit);
src/lib/audit-chain.ts:239:    project_id,
src/lib/audit-chain.ts:249:  project_id: string;
src/lib/audit-chain.ts:257:export async function verifyAuditRowChain(project_id: string, limit = 5000): Promise<boolean> {
src/lib/audit-chain.ts:258:  const result = await verifyAuditChain(project_id, limit);
src/lib/audit-signature.ts:14:  project_id: string;
src/lib/audit-signature.ts:29:    project_id: args.project_id,
src/lib/audit-signature.ts:47:    `${row_hash}|${args.prev_hash}|${args.seq}|${args.project_id}`,
src/lib/audit-signature.ts:56:    project_id: string;
src/lib/audit-signature.ts:75:    project_id: args.row.project_id,
src/lib/audit-types.ts:6:  project_id: string;
src/lib/hocker-dashboard-server.ts:34:  project_id: string;
src/lib/hocker-dashboard-server.ts:42:  project_id: string;
src/lib/hocker-dashboard-server.ts:51:  project_id: string;
src/lib/hocker-dashboard-server.ts:59:  project_id: string;
src/lib/hocker-dashboard-server.ts:100:    sb.from("nodes").select("id,project_id,name,status,updated_at"),
src/lib/hocker-dashboard-server.ts:103:      .select("id,project_id,level,type,message,created_at")
src/lib/hocker-dashboard-server.ts:109:      .select("id,project_id,command,status,created_at")
src/lib/hocker-dashboard-server.ts:112:    sb.from("supply_orders").select("id,project_id,status,total_cents,created_at"),
src/lib/hocker-dashboard-server.ts:171:    projectId: command.project_id,
src/lib/http.ts:55:  const bearer = headerAuth.replace(/^Bearer\s+/i, "").trim();
src/lib/security.ts:48:  project_id: string,
src/lib/security.ts:55:  const base = [id, project_id, node_id, command, signedCreatedAt, canonicalJson(payload)].join("|");
src/lib/security.ts:66:  project_id: string,
src/lib/security.ts:86:    project_id,
src/lib/supabase-server.ts:2:import { createServerClient } from "@supabase/ssr";
src/lib/supabase-server.ts:5:  const cookieStore = await cookies();
src/lib/supabase-server.ts:7:  return createServerClient(
src/lib/types.ts:96:  project_id: ProjectId;
src/lib/types.ts:114:  project_id: ProjectId;
src/lib/types.ts:143:  project_id: ProjectId;
src/lib/types.ts:154:  project_id: ProjectId;
src/lib/types.ts:165:  project_id: ProjectId;
src/lib/types.ts:179:  project_id: ProjectId;
src/lib/types.ts:192:  project_id: ProjectId;
src/lib/types.ts:206:  project_id: ProjectId;
src/lib/github-actions.ts:72:      Authorization: `Bearer ${token}`,
src/lib/hocker-global-health.ts:213:      .eq("project_id", "hocker-one")
src/lib/hocker-global-health.ts:260:      .eq("project_id", "hocker-one")
src/lib/hocker-global-health.ts:350:      .eq("project_id", "hocker-one")
src/lib/hocker-global-health.ts:521:          project_id: "hocker-one",
src/lib/hocker-beta-readiness.ts:96:      .eq("project_id", "hocker-one")
src/lib/hocker-beta-readiness.ts:245:          project_id: "hocker-one",
src/lib/hocker-mobile-sanity.ts:223:          project_id: "hocker-one",
src/lib/hocker-owner-api-gate.ts:33:  return value.startsWith("Bearer ") ? clean(value.slice(7)) : "";
src/lib/hocker-owner-api-gate.ts:109:export function requireOwnerOrInternal(
src/lib/require-private-session.ts:17:  const { data, error } = await supabase.auth.getUser();
src/lib/hocker-live-summary.ts:13:  project_id: string | null;
src/lib/hocker-live-summary.ts:22:  project_id: string | null;
src/lib/hocker-live-summary.ts:32:  project_id: string;
src/lib/hocker-live-summary.ts:159:    .select("project_id,user_id,role,created_at")
src/lib/hocker-live-summary.ts:165:    .select("id,project_id,level,type,message,created_at")
src/lib/hocker-live-summary.ts:171:    .select("id,project_id,node_id,command,status,error,created_at,finished_at")
src/lib/hocker-live-summary.ts:177:    .select("id,project_id,action,created_at")
src/lib/hocker-live-summary.ts:184:    .select("id,project_id,node_id,command,status,result,error,created_at,started_at,finished_at,executed_at,completed_at")
src/lib/hocker-live-summary.ts:185:    .eq("project_id", "hocker-one")
src/lib/hocker-live-summary.ts:194:    .select("id,project_id,node_id,command,status,result,error,created_at,started_at,finished_at,executed_at,completed_at")
src/lib/hocker-live-summary.ts:195:    .eq("project_id", "hocker-one")
src/lib/hocker-live-summary.ts:205:    .select("id,project_id,node_id,level,type,message,created_at")
src/lib/hocker-live-summary.ts:206:    .eq("project_id", "hocker-one")
src/lib/hocker-live-summary.ts:251:      project_id: asString(event.project_id),
src/lib/hocker-live-summary.ts:305:      project_id: String(item.project_id),
src/lib/hocker-live-summary.ts:312:      project_id: asString(item.project_id),
src/lib/hocker-live-summary.ts:320:      project_id: asString(item.project_id),
src/lib/hocker-live-summary.ts:330:      project_id: asString(item.project_id),
src/lib/hocker-node-mirror-summary.ts:81:    .select("id,project_id,node_id,command,status,result,error,created_at,started_at,finished_at,executed_at,completed_at")
src/lib/hocker-node-mirror-summary.ts:82:    .eq("project_id", "hocker-one")
src/lib/hocker-node-mirror-summary.ts:91:    .select("id,project_id,node_id,command,status,result,error,created_at,started_at,finished_at,executed_at,completed_at")
src/lib/hocker-node-mirror-summary.ts:92:    .eq("project_id", "hocker-one")
src/lib/hocker-node-mirror-summary.ts:102:    .select("id,project_id,node_id,level,type,message,created_at")
src/lib/hocker-node-mirror-summary.ts:103:    .eq("project_id", "hocker-one")
src/lib/hocker-memory-mirror.ts:102:export const learningSelect = "id,project_id,source_agi_id,source_agi_name,source_module,learning_title,learning_summary,learning_category,evidence,suggested_targets,applies_to_agi_ids,risk_level,status,update_type,source_type,source_name,source_url,source_platform,source_hash,semantic_hash,canonical_memory_key,client_id,brand_id,campaign_id,content_id,profile_id,confidence_score,freshness_score,valid_from,expires_at,prevents_error,error_pattern,recommended_action,requires_owner_approval,retention_tier,created_at,updated_at";
src/lib/hocker-memory-mirror.ts:103:export const memorySelect = "id,project_id,learning_event_id,title,summary,category,source_agi_id,source_agi_name,target_agi_ids,target_modules,source_type,source_name,source_url,source_platform,source_hash,semantic_hash,canonical_memory_key,memory_version,client_id,brand_id,campaign_id,content_id,profile_id,usefulness_score,safety_status,confidence_score,freshness_score,valid_from,expires_at,prevents_error,error_pattern,recommended_action,requires_owner_approval,retention_tier,times_seen,last_seen_at,active,created_at,updated_at";
src/lib/hocker-memory-mirror.ts:104:export const feedSelect = "id,project_id,agi_id,source_id,learning_event_id,memory_mirror_id,title,summary,update_type,priority,status,client_id,brand_id,campaign_id,content_id,profile_id,source_hash,semantic_hash,canonical_memory_key,valid_from,expires_at,confidence_score,freshness_score,prevents_error,error_pattern,recommended_action,requires_owner_approval,retention_tier,seen_by_agi,applied_by_agi,applied_at,result_note,times_seen,last_seen_at,created_at,updated_at";
src/lib/hocker-memory-mirror.ts:108:    project_id: input.projectId || "hocker-one",
src/lib/hocker-memory-mirror.ts:123:  const { data: existing } = await db.from("agi_error_patterns").select("id,times_seen").eq("project_id", input.projectId).eq("error_hash", errorHash).maybeSingle();
src/lib/hocker-memory-mirror.ts:129:    project_id: input.projectId, error_hash: errorHash, canonical_memory_key: input.canonicalKey, agi_id: input.agiId,
src/lib/agi-runtime-core.ts:189:  project_id: string;
src/lib/agi-runtime-core.ts:197:    project_id: input.project_id,
src/lib/agi-runtime-core.ts:215:async function safeCount(sb: SupabaseClient, table: string, project_id: string): Promise<{ count: number; ok: boolean; error?: string }> {
src/lib/agi-runtime-core.ts:216:  const { count, error } = await sb.from(table).select("*", { count: "exact", head: true }).eq("project_id", project_id);
src/lib/agi-runtime-core.ts:251:export async function syncAgiRuntimeCatalog(project_id: string): Promise<{ ok: boolean; error?: string }> {
src/lib/agi-runtime-core.ts:262:        project_id,
src/lib/agi-runtime-core.ts:310:          project_id,
src/lib/agi-runtime-core.ts:328:    const a = await sb.from("agi_agents").upsert(agents, { onConflict: "project_id,agi_id" });
src/lib/agi-runtime-core.ts:334:    const at = await sb.from("agi_agent_tools").upsert(agentTools, { onConflict: "project_id,agi_id,tool_key" });
src/lib/agi-runtime-core.ts:343:export async function getAgiRuntimeSummary(project_id: string) {
src/lib/agi-runtime-core.ts:346:  const sync = await syncAgiRuntimeCatalog(project_id);
src/lib/agi-runtime-core.ts:351:      safeCount(sb, "agi_agents", project_id),
src/lib/agi-runtime-core.ts:352:      safeCount(sb, "agi_tasks", project_id),
src/lib/agi-runtime-core.ts:353:      safeCount(sb, "agi_runs", project_id),
src/lib/agi-runtime-core.ts:354:      safeCount(sb, "agi_action_queue", project_id),
src/lib/agi-runtime-core.ts:355:      safeCount(sb, "agi_feedback", project_id),
src/lib/agi-runtime-core.ts:356:      safeCount(sb, "agi_chat_threads", project_id),
src/lib/agi-runtime-core.ts:362:      .eq("project_id", project_id)
src/lib/agi-runtime-core.ts:368:      project_id,
src/lib/agi-runtime-core.ts:416:      project_id,
src/lib/agi-runtime-core.ts:445:  project_id: string;
src/lib/agi-runtime-core.ts:466:    .eq("project_id", input.project_id)
src/lib/agi-runtime-core.ts:474:    project_id: input.project_id,
src/lib/agi-runtime-core.ts:496:      .eq("project_id", input.project_id)
src/lib/github-runtime-executor.ts:145:      Authorization: `Bearer ${token}`,
src/lib/agi-action-execution.ts:9:  project_id: string;
src/lib/agi-action-execution.ts:228:  project_id: string;
src/lib/agi-action-execution.ts:253:    .eq("project_id", params.project_id)
src/lib/agi-action-execution.ts:263:    const latest = await getQueueItem(params.project_id, params.action_id);
src/lib/agi-action-execution.ts:292:      Authorization: `Bearer ${token}`,
src/lib/agi-action-execution.ts:321:    .eq("project_id", projectId)
src/lib/agi-action-execution.ts:343:export async function listAgiActions(params: { project_id: string; status?: string; tool_key?: string; limit?: number }): Promise<AgiActionQueueRow[]> {
src/lib/agi-action-execution.ts:350:    .eq("project_id", params.project_id)
src/lib/agi-action-execution.ts:399:    .eq("project_id", projectId)
src/lib/agi-action-execution.ts:452:export async function decideAgiAction(params: { project_id: string; action_id: string; decision: "approve" | "reject"; actor_id: string; note?: string }): Promise<AgiActionQueueRow> {
src/lib/agi-action-execution.ts:453:  const item = await getQueueItem(params.project_id, params.action_id);
src/lib/agi-action-execution.ts:460:    await assertGuidedGithubApprovalOrder(params.project_id, item);
src/lib/agi-action-execution.ts:668:export async function executeApprovedAgiAction(params: { project_id: string; action_id: string; actor_id: string }): Promise<AgiActionQueueRow> {
src/lib/agi-action-execution.ts:669:  const pending = await getQueueItem(params.project_id, params.action_id);
src/lib/agi-action-execution.ts:676:  await assertGuidedGithubExecutionOrder(params.project_id, pending);
src/lib/agi-action-execution.ts:679:    project_id: params.project_id,
src/lib/agi-queue-lock.ts:5:  project_id: string;
src/lib/agi-queue-lock.ts:22:  project_id: string;
src/lib/agi-queue-lock.ts:81:export async function getAgiQueueLock(project_id: string, limit = 80): Promise<AgiQueueLockState> {
src/lib/agi-queue-lock.ts:83:  const safeProjectId = String(project_id || process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one").trim();
src/lib/agi-queue-lock.ts:89:      .select("id,project_id,agi_id,tool_key,action_type,title,status,risk_level,created_at,updated_at,executed_at,execution_error")
src/lib/agi-queue-lock.ts:90:      .eq("project_id", safeProjectId)
src/lib/agi-queue-lock.ts:109:      project_id: safeProjectId,
src/lib/agi-queue-lock.ts:126:      project_id: safeProjectId,
src/lib/hocker-capabilities-contract.ts:59:  project_id: string;
src/lib/hocker-capabilities-contract.ts:529:export function getHockerCapabilitiesContract(project_id = process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one"): HockerCapabilitiesContract {
src/lib/hocker-capabilities-contract.ts:538:    project_id,
src/lib/hocker-tool-router.ts:91:  project_id = process.env.NEXT_PUBLIC_HOCKER_PROJECT_ID || "hocker-one",
src/lib/hocker-tool-router.ts:93:  const contract = getHockerCapabilitiesContract(project_id);
src/lib/syntia-operational-memory.ts:111:        .select("id,project_id,level,type,message,data,created_at")
src/lib/syntia-operational-memory.ts:112:        .eq("project_id", projectId)
src/lib/syntia-operational-memory.ts:121:        .select("id,project_id,user_id,title,summary,meta,created_at,updated_at")
src/lib/syntia-operational-memory.ts:122:        .eq("project_id", projectId)
src/lib/syntia-operational-memory.ts:130:        .select("id,project_id,thread_id,role,content,meta,created_at")
src/lib/syntia-operational-memory.ts:131:        .eq("project_id", projectId)
src/lib/syntia-operational-memory.ts:140:        .eq("project_id", projectId)
src/lib/syntia-operational-memory.ts:149:        .eq("project_id", projectId)
src/lib/syntia-operational-memory.ts:185:    project_id: projectId,
src/lib/syntia-operational-memory.ts:212:    project_id: projectId,
src/lib/syntia-memory-write-gate.ts:89:  const projectId = text(input.project_id, "hocker-one", 80);
src/lib/syntia-memory-write-gate.ts:134:    project_id: projectId,
src/lib/syntia-memory-write-gate.ts:225:    .eq("project_id", draft.project_id)
src/lib/syntia-memory-write-gate.ts:232:    .eq("project_id", draft.project_id)
src/lib/syntia-memory-write-gate.ts:253:    project_id: draft.project_id,
src/lib/syntia-memory-write-gate.ts:289:      projectId: preflight.project_id,
src/lib/syntia-memory-write-gate.ts:316:      project_id: draft.project_id,
src/lib/syntia-memory-write-gate.ts:372:    projectId: draft.project_id,
src/lib/syntia-memory-write-gate.ts:406:  const projectId = text(input.project_id, "hocker-one", 80);
src/lib/syntia-memory-write-gate.ts:413:    .eq("project_id", projectId)
src/lib/syntia-memory-write-gate.ts:428:    project_id: projectId,
src/lib/syntia-memory-review-gate.ts:83:    .eq("project_id", projectId)
src/lib/syntia-memory-review-gate.ts:92:      project_id: projectId,
src/lib/syntia-memory-review-gate.ts:101:    project_id: row.project_id,
src/lib/syntia-memory-review-gate.ts:127:    project_id: projectId,
src/lib/syntia-memory-review-gate.ts:140:  const projectId = text(input.project_id, "hocker-one", 80);
src/lib/syntia-memory-review-gate.ts:177:    .eq("project_id", projectId)
src/lib/syntia-memory-review-gate.ts:200:      project_id: projectId,
src/lib/syntia-memory-review-gate.ts:256:      .eq("project_id", projectId)
src/lib/syntia-memory-review-gate.ts:275:          project_id: projectId,
src/lib/syntia-memory-review-gate.ts:344:        .eq("project_id", projectId)
src/lib/syntia-memory-review-gate.ts:351:          project_id: projectId,
src/lib/syntia-memory-publication-audit.ts:34:  let query = sb().from("agi_memory_mirror").select(memorySelect).eq("project_id", projectId);
src/lib/syntia-memory-publication-audit.ts:88:    .eq("project_id", projectId)
src/lib/syntia-memory-publication-audit.ts:96:      project_id: projectId,
src/lib/syntia-memory-publication-audit.ts:105:    project_id: row.project_id,
src/lib/syntia-memory-publication-audit.ts:134:    project_id: projectId,
src/lib/syntia-memory-publication-audit.ts:144:  const projectId = text(input.project_id, "hocker-one", 80);
src/lib/syntia-memory-publication-audit.ts:174:    .eq("project_id", projectId)
src/lib/syntia-memory-publication-audit.ts:181:    .eq("project_id", projectId)
src/lib/syntia-memory-publication-audit.ts:189:    project_id: projectId,
src/lib/syntia-memory-publication-audit.ts:253:    project_id: diff.project_id,
src/lib/syntia-memory-publication-audit.ts:278:  const projectId = text(input.project_id, "hocker-one", 80);
src/lib/syntia-memory-publication-audit.ts:294:  const preview = await previewSyntiaPublishedMemoryRollback({ ...input, project_id: projectId });
src/lib/syntia-memory-publication-audit.ts:354:    .eq("project_id", projectId)
src/lib/syntia-memory-publication-audit.ts:387:    .eq("project_id", projectId)
src/lib/syntia-memory-publication-audit.ts:398:    .eq("project_id", projectId)
src/lib/nova-chat-action-drafts.ts:189:  project_id: string;
src/lib/nova-chat-action-drafts.ts:201:    project_id: params.project_id,
src/lib/nova-chat-action-drafts.ts:230:  project_id: string;
src/lib/nova-chat-action-drafts.ts:243:    project_id: params.project_id,
src/lib/nova-github-action-materializer.ts:173:  project_id: string;
src/lib/nova-github-action-materializer.ts:181:    project_id: params.project_id,
src/lib/nova-github-action-materializer.ts:222:  project_id: string;
src/lib/nova-github-action-materializer.ts:228:    project_id: params.project_id,
src/lib/nova-github-action-materializer.ts:275:        project_id: params.project_id,
src/lib/nova-github-action-materializer.ts:295:    project_id: params.project_id,
src/lib/hocker-provider-orchestrator.ts:66:        Authorization: `Bearer ${key}`,
src/lib/hocker-provider-orchestrator.ts:178:    project_id: projectId,
src/components/hocker-2c/owner/nova/OwnerNovaInlineApprovals.tsx:13:    "/api/agi/runtime/actions?project_id=hocker-one&limit=30",
src/components/hocker-2c/owner/nova/OwnerNovaInlineApprovals.tsx:94:        project_id: action.projectId || DEFAULT_PROJECT_ID,
src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:232:    "/api/agi/runtime/actions?project_id=hocker-one&limit=30",
src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:260:    "/api/agi/runtime/actions?project_id=hocker-one&status=executed&limit=8",
src/components/hocker-2c/owner/nova/OwnerNovaInlineExecutions.tsx:410:        project_id: action.projectId || DEFAULT_PROJECT_ID,
src/components/hocker-2c/owner/live/OwnerActionsLivePanel.tsx:12:    "/api/agi/runtime/actions?project_id=hocker-one&limit=30",
src/components/hocker-2c/owner/live/OwnerEvidenceLivePanel.tsx:11:    "/api/agi/runtime/actions?project_id=hocker-one&status=executed&limit=30",
src/components/hocker-2c/owner/live/owner-live-normalizers.ts:95:      const target = asString(item.target || item.repository || item.project_id || item.app, "Hocker ONE");
src/components/hocker-2c/owner/live/owner-live-normalizers.ts:117:        projectId: asString(item.project_id || item.projectId, "hocker-one"),
src/components/hocker-2c/owner/live/owner-live-normalizers.ts:141:      const target = asString(item.target || item.repository || item.project_id || item.app, "Hocker ONE");
src/components/hocker-2c/owner/live/OwnerLiveSummary.tsx:37:    (await fetchJson("/api/agi/runtime/actions?project_id=hocker-one&limit=30")) ??
src/components/hocker-2c/owner/live/OwnerLiveSummary.tsx:42:    (await fetchJson("/api/agi/runtime/actions?project_id=hocker-one&status=executed&limit=30")) ??
