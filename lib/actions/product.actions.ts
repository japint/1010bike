"use server";
import { PrismaClient } from "@prisma/client";
import { convertToPlainObject } from "@/lib/utils";
import { LATEST_PRODUCTS_LIMIT } from "@/lib/constants";

// get latest products
export async function getLatestProducts() {
  const prisma = new PrismaClient();
  try {
    const data = await prisma.product.findMany({
      take: LATEST_PRODUCTS_LIMIT,
      orderBy: {
        CreatedAt: "desc",
      },
    });
    return convertToPlainObject(data);
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
