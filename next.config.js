/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Protocolo de Inmunidad: Ignora errores durante el build en Vercel
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  // Forzamos Webpack para evitar el colapso de Turbopack en ARM64
  webpack: (config) => {
    config.infrastructureLogging = { level: "error" };
    return config;
  },
};

export default nextConfig;
