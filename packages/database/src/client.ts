import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export function createPrismaClient(databaseUrl: string): PrismaClient {
  const adapter = new PrismaPg({ connectionString: databaseUrl });
  return new PrismaClient({ adapter });
}

export function getPrisma(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. Prisma migrate, seed, and database access are blocked until a real connection string is provided.",
    );
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient(databaseUrl);
  }

  return globalForPrisma.prisma;
}
