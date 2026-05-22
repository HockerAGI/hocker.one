export const HOCKER_PUBLIC_PRIVATE_TOPOLOGY_VERSION = "12.7L-1";

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
          structured_data_ready: false,
        },
      },
      private_operational: {
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
      service_worker_registered: true,
      no_private_routes_in_sitemap: true,
      nova_remains_primary_interface: true,
      owner_gate_remains_required_for_execution: true,
    },
    next_step: "12.7L-2 debe consolidar shell /app, navegación pública premium, structured data y noindex por metadata cuando aplique.",
  };
}
