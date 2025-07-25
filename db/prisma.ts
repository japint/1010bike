import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Create a new PrismaClient with error handling
const createPrismaClient = () => {
  try {
    return new PrismaClient({
      // TODO: Remove query logging later - currently showing all SQL queries in terminal
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "error", "warn"]
          : ["error"],
    });
  } catch (error) {
    console.error("Failed to create Prisma client:", error);
    // Return a mock client for temporary fallback
    return new PrismaClient();
  }
};

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
