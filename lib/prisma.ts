import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../prisma/generated/client/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

let prisma: PrismaClient;

if (globalForPrisma.prisma) {
  prisma = globalForPrisma.prisma;
} else {
  // Pass configuration directly to Prisma 7 adapter
  const adapter = new PrismaBetterSqlite3({
    url: './prisma/dev.db',
    timeout: 5000,
  });
  
  prisma = new PrismaClient({ 
    adapter, 
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'] 
  });
  
  // Pragmas can be executed via the client after initialization
  // Note: better-sqlite3 adapter for Prisma 7 handles SQLite connections internally.
}

export { prisma };

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
