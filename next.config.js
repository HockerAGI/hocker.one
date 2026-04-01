/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Protocolo de Inmunidad: Solo mantenemos el bypass de TypeScript
  typescript: { ignoreBuildErrors: true },
  // Forzamos Webpack para compatibilidad universal con el búnker local
  webpack: (config) => {
    config.infrastructureLogging = { level: "error" };
    return config;
  },
};

export default nextConfig;
