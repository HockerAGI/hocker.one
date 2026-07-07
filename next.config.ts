import type { NextConfig } from "next";
import {
  getHockerNextHeadersConfig,
} from "./src/lib/hocker-public-private-topology";

const nextConfig: NextConfig = {
  async headers() {
    return getHockerNextHeadersConfig();
  },

  reactStrictMode: true,
  webpack: (config) => {
    config.infrastructureLogging = { level: "error" };
    return config;
  },
};

export default nextConfig;
