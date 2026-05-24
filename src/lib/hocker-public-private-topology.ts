export const HOCKER_PUBLIC_PRIVATE_TOPOLOGY_VERSION = "12.7L-2C-A.1";

export const HOCKER_PUBLIC_TOPOLOGY_HEADER = "12.7L-2C-public-indexable-clean";
export const HOCKER_PRIVATE_TOPOLOGY_HEADER = "12.7L-2C-private-noindex-clean";

export const HOCKER_PUBLIC_INDEXABLE_ROUTES = [
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

export const HOCKER_PUBLIC_ACCESS_ROUTES = [
  "/login",
] as const;

export const HOCKER_PUBLIC_ROUTES = [
  ...HOCKER_PUBLIC_INDEXABLE_ROUTES,
  ...HOCKER_PUBLIC_ACCESS_ROUTES,
] as const;

export const HOCKER_APP_ALIAS_ROUTES = [
  "/app",
  "/app/nova",
  "/app/actividad",
  "/app/pendientes",
  "/app/ecosistema",
  "/app/ajustes",
] as const;

export const HOCKER_PRIVATE_ROUTES = [
  ...HOCKER_APP_ALIAS_ROUTES,
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

export const HOCKER_PROTECTED_ROUTES = [
  "/chido",
  "/security",
  "/admin",
  "/access",
] as const;

export const HOCKER_TECHNICAL_NOINDEX_ROUTES = [
  "/auth/callback",
] as const;

export const HOCKER_PUBLIC_SITEMAP_ROUTES = HOCKER_PUBLIC_INDEXABLE_ROUTES;

export const HOCKER_NOINDEX_ROUTES = [
  "/api",
  ...HOCKER_PRIVATE_ROUTES,
  ...HOCKER_PROTECTED_ROUTES,
  ...HOCKER_TECHNICAL_NOINDEX_ROUTES,
] as const;

export function isExactOrChild(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function isHockerPublicRoute(pathname: string): boolean {
  return HOCKER_PUBLIC_ROUTES.some((route) => isExactOrChild(pathname, route));
}

export function isHockerPublicIndexableRoute(pathname: string): boolean {
  return HOCKER_PUBLIC_INDEXABLE_ROUTES.some((route) => isExactOrChild(pathname, route));
}

export function isHockerNoindexRoute(pathname: string): boolean {
  return HOCKER_NOINDEX_ROUTES.some((route) => isExactOrChild(pathname, route));
}

export function getHockerPublicPrivateTopologyContext() {
  return {
    version: HOCKER_PUBLIC_PRIVATE_TOPOLOGY_VERSION,
    status: "active",
    mode: "public_private_protected_topology",
    source: "hocker-one",
    headers: {
      public: HOCKER_PUBLIC_TOPOLOGY_HEADER,
      private: HOCKER_PRIVATE_TOPOLOGY_HEADER,
    },
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
      public_access: {
        purpose: "Permitir acceso/login sin exponer operación interna.",
        routes: HOCKER_PUBLIC_ACCESS_ROUTES,
        index_policy: "public_runtime_safe",
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
      technical_noindex: {
        purpose: "Rutas técnicas que no deben indexarse aunque participen en auth o callbacks.",
        routes: HOCKER_TECHNICAL_NOINDEX_ROUTES,
        index_policy: "noindex_header",
      },
    },
    rules: {
      public_pages_must_not_expose_runtime_state: true,
      private_pages_require_session: true,
      private_pages_noindex: true,
      protected_pages_noindex: true,
      api_routes_noindex: true,
      auth_callback_noindex: true,
      pwa_manifest_enabled: true,
      structured_data_enabled: true,
      pwa_start_url_app_nova: true,
      service_worker_registered: true,
      no_private_routes_in_sitemap: true,
      nova_remains_primary_interface: true,
      nova_decides_provider_internally: true,
      owner_gate_remains_required_for_execution: true,
    },
    next_step: "12.7L-2C-B debe agregar router diagnóstico multi-proveedor sin duplicar el router LLM nativo de NOVA.AGI.",
  };
}
