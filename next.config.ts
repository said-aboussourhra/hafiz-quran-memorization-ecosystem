import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // إزالة eslint من هنا
  typescript: {
    ignoreBuildErrors: true,
  },
  // eslint تم نقله إلى eslint.config.mjs
  serverExternalPackages: ['drizzle-orm', 'pg'],
  env: {
    DATABASE_URL: process.env.DATABASE_URL || '',
  },
  staticPageGenerationTimeout: 120,
};

export default nextConfig;