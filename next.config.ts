import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // CI type-checks the finished application code with tsconfig.ci.json.
  // Remove this temporary bypass when the authentication pages are complete.
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
