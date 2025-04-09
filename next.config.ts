import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.fbcdn.net', // Allow all fbcdn.net subdomains
      },
    ],
  },
};

export default nextConfig;
