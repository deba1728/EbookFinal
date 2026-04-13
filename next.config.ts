import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow external image sources for book covers
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
