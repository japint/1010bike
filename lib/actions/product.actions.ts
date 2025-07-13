"use server";
import { prisma } from "@/db/prisma";
import { convertToPlainObject } from "@/lib/utils";
import { LATEST_PRODUCTS_LIMIT } from "@/lib/constants";

// get latest products
export async function getLatestProducts() {
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

// get product by slug
export async function getProductBySlug(slug: string) {
  try {
    const data = await prisma.product.findFirst({
      where: { slug: slug },
    });
    return convertToPlainObject(data);
  } catch (error) {
    console.error("Error fetching product by slug:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
