import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    '100.111.124.85',
    '100.111.124.85:3000',
    'localhost',
    'localhost:3000',
  ],
};

export default nextConfig;
