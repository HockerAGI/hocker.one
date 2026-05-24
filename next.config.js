const hockerPublicIndexableHeaders = [
  {
    key: "X-Hocker-Topology",
    value: "12.7L-2C-public-indexable-clean",
  },
];

const hockerPublicIndexableSources = [
  "/",
  "/one",
  "/empresa",
  "/servicios",
  "/ecosistema",
  "/soluciones",
  "/casos",
  "/seguridad",
  "/contacto",
];

/** @type {import('next').NextConfig} */

const hockerPrivateNoindexHeaders = [
  {
    key: "X-Robots-Tag",
    value: "noindex, nofollow, noarchive",
  },
  {
    key: "X-Hocker-Topology",
    value: "12.7L-2C-private-noindex-clean",
  },
];

const hockerPrivateNoindexSources = [
  "/auth/callback",
  "/auth/callback/:path*",
  "/app/:path*",
  "/api/:path*",
  "/chat/:path*",
  "/dashboard/:path*",
  "/live/:path*",
  "/map/:path*",
  "/apps/:path*",
  "/agis/:path*",
  "/nodes/:path*",
  "/owner/:path*",
  "/commands/:path*",
  "/integrations/:path*",
  "/status/:path*",
  "/memory/:path*",
  "/governance/:path*",
  "/supply/:path*",
  "/mobile/:path*",
  "/launch/:path*",
  "/chido/:path*",
  "/security/:path*",
  "/admin/:path*",
  "/access/:path*",
];

const nextConfig = {
  async headers() {
    return [
      ...hockerPublicIndexableSources.map((source) => ({
        source,
        headers: hockerPublicIndexableHeaders,
      })),
      ...hockerPrivateNoindexSources.map((source) => ({
        source,
        headers: hockerPrivateNoindexHeaders,
      })),
    ];
  },

  reactStrictMode: true,
  webpack: (config) => {
    config.infrastructureLogging = { level: "error" };
    return config;
  },
};

export default nextConfig;