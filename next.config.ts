import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.guim.co.uk",
      },
      {
        protocol: "https",
        hostname: "i.guim.co.uk",
      },
    ],
  },
};

export default nextConfig;
