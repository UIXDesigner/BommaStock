import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  serverExternalPackages: ["@node-rs/argon2", "@prisma/adapter-pg", "pg"],
  transpilePackages: [
    "@bommastock/auth",
    "@bommastock/commerce",
    "@bommastock/config",
    "@bommastock/database",
    "@bommastock/image-processing",
    "@bommastock/payments",
    "@bommastock/storage",
    "@bommastock/types",
    "@bommastock/ui",
  ],
};

export default nextConfig;
