/**
 * Prisma Client Singleton
 * ------------------------
 * In Next.js development mode, the server restarts on every file change.
 * Without this pattern, each restart would create a NEW Prisma connection,
 * eventually exhausting the connection pool.
 *
 * This file ensures we reuse a single Prisma instance across hot reloads.
 */

import { PrismaClient } from "@prisma/client";

// We attach the client to `globalThis` in development so it survives HMR
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Uncomment the line below to see every SQL query in the terminal (useful for debugging)
    // log: ["query"],
  });

// Only cache the instance in development — production creates a fresh client each time
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
