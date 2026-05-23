export const HOCKER_PUBLIC_PRIVATE_TOPOLOGY_VERSION = "12.7L-2B-3";

export const HOCKER_PUBLIC_ROUTES = [
  "/",
  "/one",
  "/empresa",
  "/servicios",
  "/ecosistema",
  "/soluciones",
  "/casos",
  "/seguridad",
  "/contacto",
  "/login",
  "/auth/callback",
] as const;

export const HOCKER_PRIVATE_ROUTES = [
  "/app",
  "/app/nova",
  "/app/actividad",
  "/app/pendientes",
  "/app/ecosistema",
  "/app/ajustes",
  "/dashboard",
  "/chat",
  "/live",
  "/map",
  "/apps",
  "/agis",
  "/nodes",
  "/owner",
  "/commands",
  "/integrations",
  "/status",
  "/memory",
  "/governance",
  "/supply",
  "/mobile",
  "/launch",
] as const;

export const HOCKER_APP_ALIAS_ROUTES = [
  "/app",
  "/app/nova",
  "/app/actividad",
  "/app/pendientes",
  "/app/ecosistema",
  "/app/ajustes",
] as const;

export const HOCKER_PROTECTED_ROUTES = [
  "/chido",
  "/security",
  "/admin",
  "/access",
] as const;

export const HOCKER_PUBLIC_SITEMAP_ROUTES = [
  "/",
  "/one",
  "/empresa",
  "/servicios",
  "/ecosistema",
  "/soluciones",
  "/casos",
  "/seguridad",
  "/contacto",
] as const;

export function isHockerPublicRoute(pathname: string): boolean {
  return HOCKER_PUBLIC_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function getHockerPublicPrivateTopologyContext() {
  return {
    version: HOCKER_PUBLIC_PRIVATE_TOPOLOGY_VERSION,
    status: "active",
    mode: "public_private_protected_topology",
    source: "hocker-one",
    layers: {
      public_indexable: {
        purpose: "Explicar, vender, posicionar y convertir sin exponer operación interna.",
        routes: HOCKER_PUBLIC_SITEMAP_ROUTES,
        seo: {
          sitemap: "/sitemap.xml",
          robots: "/robots.txt",
          manifest: "/manifest.webmanifest",
          canonical_required: true,
          structured_data_ready: true,
        },
      },
      private_operational: {
        route_aliases: HOCKER_APP_ALIAS_ROUTES,
        purpose: "Operar NOVA, AGIs, acciones, estado, memoria, integraciones y auditoría bajo sesión.",
        routes: HOCKER_PRIVATE_ROUTES,
        index_policy: "noindex_header",
      },
      protected_sensitive: {
        purpose: "Aislar módulos sensibles como Chido, seguridad, accesos y administración.",
        routes: HOCKER_PROTECTED_ROUTES,
        index_policy: "noindex_header",
      },
    },
    rules: {
      public_pages_must_not_expose_runtime_state: true,
      private_pages_require_session: true,
      private_pages_noindex: true,
      api_routes_noindex: true,
      pwa_manifest_enabled: true,
      structured_data_enabled: true,
      pwa_start_url_app_nova: true,
      lighthouse_diagnostics_required: true,
      header_trace_cleaned: true,
      service_worker_registered: true,
      no_private_routes_in_sitemap: true,
      nova_remains_primary_interface: true,
      owner_gate_remains_required_for_execution: true,
    },
    next_step: "12.7L-2B-STABLE debe cerrar Lighthouse real, PWA installable, service worker y trazabilidad limpia antes de Fase 13.",
  };
}
