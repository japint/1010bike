"use server";
import { prisma } from "@/db/prisma";
import { convertToPlainObject, formatError } from "@/lib/utils";
import { LATEST_PRODUCTS_LIMIT, PAGE_SIZE } from "@/lib/constants";
import { revalidatePath } from "next/cache";

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

// Get all products
export async function getAllProducts({
  // query,
  limit = PAGE_SIZE,
  page,
}: // category,
{
  query: string;
  limit?: number;
  page: number;
  category?: string;
}) {
  const data = await prisma.product.findMany({
    skip: (page - 1) * limit,
    take: limit,
  });

  const dataCount = await prisma.product.count();
  return {
    data,
    totalPages: Math.ceil(dataCount / limit),
  };
}

// Delete a product
export async function deleteProduct(id: string) {
  try {
    const productExist = await prisma.product.findFirst({
      where: { id },
    });

    if (!productExist) throw new Error("Product not found");

    await prisma.product.delete({
      where: { id },
    });

    revalidatePath("/admin/products");

    return { success: true, message: "Product deleted successfully" };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}
