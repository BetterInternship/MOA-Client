import type { NextConfig } from "next";
const isDev = process.env.DEVELOPMENT_ENV == "true";

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: isDev,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
