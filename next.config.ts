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
