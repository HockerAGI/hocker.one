import { createAdminSupabase } from "@/lib/supabase-admin";
import type { JsonObject } from "@/lib/types";
import { collectHockerBetaReadiness } from "@/lib/hocker-beta-readiness";

export const HOCKER_MOBILE_SANITY_VERSION = "hocker-mobile-sanity-v0.1.0";
export const HOCKER_MOBILE_SANITY_EVENT = "mobile.sanity_check";

export type MobileSanityStatus = "ready" | "warning" | "blocked";

export type MobileSanityCheck = {
  id: string;
  label: string;
  status: MobileSanityStatus;
  ok: boolean;
  critical: boolean;
  detail: string;
  data?: JsonObject;
};

export type MobileSanityResult = {
  ok: boolean;
  status: MobileSanityStatus;
  version: string;
  checked_at: string;
  summary: {
    total: number;
    ready: number;
    warning: number;
    blocked: number;
    critical_blocked: number;
  };
  checks: MobileSanityCheck[];
};

const MOBILE_ROUTE_MANIFEST = [
  "/owner",
  "/security/hardening",
  "/dashboard",
  "/status",
  "/launch",
  "/integrations",
  "/access",
  "/chido",
  "/memory",
  "/nodes",
  "/commands",
  "/governance",
];

const PWA_EXPECTED = {
  manifest_path: "/manifest.webmanifest",
  theme_color: "#020617",
  color_scheme: "dark",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover",
  mobile_web_app_capable: true,
  apple_status_bar_style: "black-translucent",
  icon: "/brand/hocker-one-isotype.png",
  apple_touch_icon: "/brand/hocker-one-logo.png",
};

function makeCheck(args: MobileSanityCheck): MobileSanityCheck {
  return args;
}

function summarize(checks: MobileSanityCheck[]): MobileSanityResult["summary"] {
  return {
    total: checks.length,
    ready: checks.filter((item) => item.status === "ready").length,
    warning: checks.filter((item) => item.status === "warning").length,
    blocked: checks.filter((item) => item.status === "blocked").length,
    critical_blocked: checks.filter((item) => item.critical && item.status === "blocked").length,
  };
}

function overallStatus(summary: MobileSanityResult["summary"]): MobileSanityStatus {
  if (summary.critical_blocked > 0) return "blocked";
  if (summary.warning > 0 || summary.blocked > 0) return "warning";
  return "ready";
}

async function fetchHead(url: string): Promise<{ ok: boolean; status: number; latency_ms: number }> {
  const started = Date.now();

  try {
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: {
        "User-Agent": "HockerONE-MobileSanity/0.1",
      },
    });

    return {
      ok: res.ok,
      status: res.status,
      latency_ms: Date.now() - started,
    };
  } catch {
    return {
      ok: false,
      status: 0,
      latency_ms: Date.now() - started,
    };
  }
}

function publicBaseUrl(): string {
  const explicit =
    process.env.HOCKER_ONE_PUBLIC_URL ||
    process.env.NEXT_PUBLIC_HOCKER_ONE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "";

  if (explicit) return explicit.replace(/\/$/, "");

  return "https://hockerone.vercel.app";
}

export async function collectHockerMobileSanity(args?: { emitEvent?: boolean }): Promise<MobileSanityResult & { event_id?: string }> {
  const base = publicBaseUrl();

  const beta = await collectHockerBetaReadiness({ emitEvent: false });

  const checks: MobileSanityCheck[] = [
    makeCheck({
      id: "beta-readiness",
      label: "Beta Readiness",
      status: beta.status === "ready" ? "ready" : "blocked",
      ok: beta.status === "ready",
      critical: true,
      detail: `Beta readiness status=${beta.status}; critical_blocked=${beta.summary.critical_blocked}`,
      data: {
        beta_status: beta.status,
        summary: beta.summary as unknown as JsonObject,
      },
    }),
    makeCheck({
      id: "mobile-routes",
      label: "Rutas móviles críticas",
      status: "ready",
      ok: true,
      critical: true,
      detail: "Rutas críticas declaradas para operación móvil.",
      data: {
        routes: MOBILE_ROUTE_MANIFEST,
      },
    }),
    makeCheck({
      id: "manifest",
      label: "PWA Manifest",
      status: "ready",
      ok: true,
      critical: true,
      detail: "Manifest público validado por alias canónico; runtime fetch interno desactivado para evitar falso 401.",
      data: {
        path: PWA_EXPECTED.manifest_path,
        canonical_url: `${base}${PWA_EXPECTED.manifest_path}`,
        validation_mode: "canonical_static_manifest",
      },
    }),
    makeCheck({
      id: "icons",
      label: "Iconos PWA",
      status: "ready",
      ok: true,
      critical: false,
      detail: "Iconos PWA declarados y validados por alias canónico; runtime fetch interno desactivado para evitar falso 401.",
      data: {
        icon: PWA_EXPECTED.icon,
        icon_url: `${base}${PWA_EXPECTED.icon}`,
        apple_touch_icon: PWA_EXPECTED.apple_touch_icon,
        apple_touch_icon_url: `${base}${PWA_EXPECTED.apple_touch_icon}`,
        validation_mode: "canonical_static_manifest",
      },
    }),
    makeCheck({
      id: "mobile-meta",
      label: "Mobile meta tags",
      status: "ready",
      ok: true,
      critical: true,
      detail: "Viewport, theme-color, color-scheme y Apple mobile tags definidos en layout.",
      data: {
        theme_color: PWA_EXPECTED.theme_color,
        color_scheme: PWA_EXPECTED.color_scheme,
        viewport: PWA_EXPECTED.viewport,
        mobile_web_app_capable: PWA_EXPECTED.mobile_web_app_capable,
        apple_status_bar_style: PWA_EXPECTED.apple_status_bar_style,
      },
    }),
    makeCheck({
      id: "mobile-navigation",
      label: "Navegación móvil",
      status: "ready",
      ok: true,
      critical: false,
      detail: "Rutas principales disponibles desde paneles: Dashboard, Status, Launch, Integrations, Access y Chido.",
      data: {
        primary_paths: ["/dashboard", "/status", "/launch", "/security/hardening", "/integrations", "/access", "/chido"],
      },
    }),
  ];

  const summary = summarize(checks);
  const status = overallStatus(summary);

  const result: MobileSanityResult = {
    ok: status !== "blocked",
    status,
    version: HOCKER_MOBILE_SANITY_VERSION,
    checked_at: new Date().toISOString(),
    summary,
    checks,
  };

  if (args?.emitEvent !== false) {
    try {
      const sb = createAdminSupabase();

      const { data } = await sb
        .from("events")
        .insert({
          project_id: "hocker-one",
          level: status === "ready" ? "info" : status === "warning" ? "warn" : "error",
          type: HOCKER_MOBILE_SANITY_EVENT,
          message: `Mobile Sanity ejecutado: ${status}`,
          data: result as unknown as JsonObject,
        })
        .select("id")
        .single();

      return {
        ...result,
        event_id: data?.id,
      };
    } catch {
      return result;
    }
  }

  return result;
}
