import { PrismaClient } from "@prisma/client";

/**
 * PrismaClient singleton instance for Next.js App Router.
 *
 * In development, Next.js clears the Node.js require cache on every hot-reload (HMR).
 * Without storing the client instance on globalThis, every HMR event creates a new
 * PrismaClient instance with its own SQLite connection handle, rapidly exhausting file
 * descriptors and triggering SQLITE_BUSY database lock exceptions.
 *
 * Attaching the singleton to globalThis preserves the single connection pool across
 * hot-reloads in development, while production utilizes standard module-scoped lifecycle.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
