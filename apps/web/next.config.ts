import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactCompiler: true,
  typescript: {
    // We run type checking separately
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
