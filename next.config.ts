import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React strict mode
  reactStrictMode: true,
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.vercel.app",
      },
    ],
  },
  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};

export default nextConfig;
