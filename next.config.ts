import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ['drizzle-orm', 'pg'],
  env: {
    DATABASE_URL: process.env.DATABASE_URL || '',
  },
  // منع الاتصال بقاعدة البيانات أثناء البناء
  staticPageGenerationTimeout: 120,
};

export default nextConfig;