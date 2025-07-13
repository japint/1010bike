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

    // Convert Decimal fields to strings to match the Product type
    const convertedData = data.map((product) => ({
      ...product,
      price: product.price.toString(),
      rating: product.rating.toString(),
    }));

    return convertToPlainObject(convertedData);
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

    if (!data) return null;

    // Convert Decimal fields to strings to match the Product type
    const convertedData = {
      ...data,
      price: data.price.toString(),
      rating: data.rating.toString(),
    };

    return convertToPlainObject(convertedData);
  } catch (error) {
    console.error("Error fetching product by slug:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}
