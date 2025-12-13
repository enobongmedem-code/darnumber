// ============================================
// DATABASE CONFIGURATION
// ============================================

import { PrismaClient } from "@prisma/client";

// Primary database for writes
export const prisma = new PrismaClient({
  log:
    process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error", "warn"],
});

// Read replica for read operations (optional, for scalability)
export const readPrisma = process.env.DATABASE_READ_URL
  ? new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_READ_URL,
        },
      },
      log:
        process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    })
  : prisma; // Fallback to primary if no read replica

// Connection lifecycle management
export async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log("✅ Database connected (primary)");

    if (process.env.DATABASE_READ_URL) {
      await readPrisma.$connect();
      console.log("✅ Database connected (read replica)");
    }
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
  }
}

export async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    if (process.env.DATABASE_READ_URL) {
      await readPrisma.$disconnect();
    }
    console.log("✅ Database disconnected");
  } catch (error) {
    console.error("❌ Database disconnection error:", error);
  }
}

// Health check
export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error("Database health check failed:", error);
    return false;
  }
}

// Note: Prisma middleware ($use) is commented out as it may not be available in all versions
// If you need query logging, consider using Prisma's built-in logging or extensions
/*
prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();

  const duration = after - before;

  // Log slow queries (>1 second)
  if (duration > 1000) {
    console.warn(`⚠️  Slow query detected (${duration}ms):`, {
      model: params.model,
      action: params.action,
      duration: `${duration}ms`,
    });
  }

  return result;
});
*/

// Handle graceful shutdown
process.on("beforeExit", async () => {
  await disconnectDatabase();
});
