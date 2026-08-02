export const HOCKER_PUBLIC_PRIVATE_TOPOLOGY_VERSION = "12.7L-2C-B.0";

export const HOCKER_PUBLIC_TOPOLOGY_HEADER = "12.7L-2C-access-only";
export const HOCKER_PRIVATE_TOPOLOGY_HEADER = "12.7L-2C-private-control-noindex";

// Corporate content belongs to HockerAGI/hocker.agi and is redirected in next.config.ts.
export const HOCKER_PUBLIC_INDEXABLE_ROUTES = [] as const;

export const HOCKER_PUBLIC_ACCESS_ROUTES = [
  "/login",
  "/api/health/ping",
] as const;

export const HOCKER_PUBLIC_ROUTES = [
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
  "/catalog",
  "/chat",
  "/live",
  "/map",
  "/apps",
  "/agis",
  "/workers",
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

export function getHockerNextHeadersConfig(): Array<{
  source: string;
  headers: Array<{ key: string; value: string }>;
}> {
  const publicHeaders = [
    { key: "X-Hocker-Topology", value: HOCKER_PUBLIC_TOPOLOGY_HEADER },
  ];

  const noindexHeaders = [
    { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
    { key: "X-Hocker-Topology", value: HOCKER_PRIVATE_TOPOLOGY_HEADER },
  ];

  const publicEntries = HOCKER_PUBLIC_INDEXABLE_ROUTES.map((route) => ({
    source: route,
    headers: publicHeaders,
  }));

  const noindexEntries = HOCKER_NOINDEX_ROUTES.map((route) => ({
    source: `${route}/:path*`,
    headers: noindexHeaders,
  }));

  return [...publicEntries, ...noindexEntries];
}

export function getHockerPublicPrivateTopologyContext() {
  return {
    version: HOCKER_PUBLIC_PRIVATE_TOPOLOGY_VERSION,
    status: "active",
    mode: "private_control_panel_with_external_corporate_site",
    source: "hocker-one",
    corporate_site: {
      repository: "HockerAGI/hocker.agi",
      url: "https://hockeragi.vercel.app",
      responsibility: "Sitio corporativo, contenido público, posicionamiento y conversión.",
    },
    control_panel: {
      repository: "HockerAGI/hocker.one",
      url: "https://hockerone.vercel.app",
      responsibility: "Control privado, estado operativo, aprobaciones, evidencia y ejecución supervisada.",
    },
    headers: {
      public: HOCKER_PUBLIC_TOPOLOGY_HEADER,
      private: HOCKER_PRIVATE_TOPOLOGY_HEADER,
    },
    layers: {
      public_indexable: {
        purpose: "No alojar contenido corporativo duplicado en Hocker ONE.",
        routes: HOCKER_PUBLIC_SITEMAP_ROUTES,
        index_policy: "empty_sitemap",
      },
      public_access: {
        purpose: "Permitir autenticación y health checks mínimos.",
        routes: HOCKER_PUBLIC_ACCESS_ROUTES,
        index_policy: "access_only",
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
        purpose: "Rutas técnicas que no deben indexarse.",
        routes: HOCKER_TECHNICAL_NOINDEX_ROUTES,
        index_policy: "noindex_header",
      },
    },
    rules: {
      corporate_content_redirects_to_hocker_agi: true,
      private_pages_require_session: true,
      private_pages_noindex: true,
      protected_pages_noindex: true,
      api_routes_noindex: true,
      auth_callback_noindex: true,
      no_private_routes_in_sitemap: true,
      owner_gate_remains_required_for_execution: true,
      configured_is_not_connected: true,
      runtime_claims_require_recent_evidence: true,
    },
    next_step: "Completar health checks persistidos para cada integración y worker antes de habilitar nuevas aplicaciones.",
  };
}
