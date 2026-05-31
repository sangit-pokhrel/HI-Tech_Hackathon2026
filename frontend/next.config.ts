import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination: "/api/auth/:path*", // Don't rewrite NextAuth internal routes
      },
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:3001/api/:path*", // Proxy all other API requests to backend on port 3001
      },
    ];
  },
};

export default nextConfig;
