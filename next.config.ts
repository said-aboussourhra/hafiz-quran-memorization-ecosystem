import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Let Next.js / the platform handle server-runtime env. Do NOT bake
  // DATABASE_URL into the build here: at build time it may be empty and can
  // shadow the real runtime value on Vercel.
  serverExternalPackages: ["drizzle-orm", "pg"],
  staticPageGenerationTimeout: 120,
};

export default nextConfig;
