import type { NextConfig } from "next";
import { getHockerNextHeadersConfig } from "./src/lib/hocker-public-private-topology";

const CORPORATE_SITE = "https://hockeragi.vercel.app";

const nextConfig: NextConfig = {
  async headers() {
    return getHockerNextHeadersConfig();
  },

  async redirects() {
    return [
      { source: "/", destination: "/owner", permanent: false },

      // Canonical private control routes. These aliases previously rendered
      // separate interfaces with duplicated or static status claims.
      { source: "/app", destination: "/owner", permanent: false },
      { source: "/app/nova", destination: "/chat", permanent: false },
      { source: "/app/actividad", destination: "/live", permanent: false },
      { source: "/app/pendientes", destination: "/commands", permanent: false },
      { source: "/app/ecosistema", destination: "/apps", permanent: false },
      { source: "/app/ajustes", destination: "/governance", permanent: false },
      { source: "/owner/apps", destination: "/apps", permanent: false },
      { source: "/owner/agis", destination: "/agis", permanent: false },
      { source: "/owner/nova", destination: "/chat", permanent: false },
      { source: "/owner/ecosystem", destination: "/map", permanent: false },
      { source: "/owner/command-center", destination: "/owner", permanent: false },
      { source: "/system", destination: "/status", permanent: false },
      { source: "/launch", destination: "/status", permanent: false },
      { source: "/mobile", destination: "/owner", permanent: false },

      // Corporate content belongs exclusively to HockerAGI/hocker.agi.
      { source: "/one", destination: CORPORATE_SITE, permanent: true },
      { source: "/empresa", destination: `${CORPORATE_SITE}/#empresa`, permanent: true },
      { source: "/servicios", destination: `${CORPORATE_SITE}/#soluciones`, permanent: true },
      { source: "/ecosistema", destination: `${CORPORATE_SITE}/ecosistema`, permanent: true },
      { source: "/soluciones", destination: `${CORPORATE_SITE}/soluciones`, permanent: true },
      { source: "/casos", destination: `${CORPORATE_SITE}/portfolio`, permanent: true },
      { source: "/seguridad", destination: CORPORATE_SITE, permanent: true },
      { source: "/contacto", destination: `${CORPORATE_SITE}/contacto`, permanent: true },
    ];
  },

  reactStrictMode: true,
  turbopack: {},
  webpack: (config) => {
    config.infrastructureLogging = { level: "error" };
    return config;
  },
};

export default nextConfig;
