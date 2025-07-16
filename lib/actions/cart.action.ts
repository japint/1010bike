"use server";

import { cookies } from "next/headers";
import { CartItem } from "@/types";
import { convertToPlainObject, formatError, round2 } from "../utils";
import { auth } from "@/auth";
import { prisma } from "@/db/prisma";
import { cartItemSchema } from "../validators";
import { revalidatePath } from "next/cache";

// calculate cart prices
const calcPrice = (items: CartItem[]) => {
  const itemsPrice = round2(
      items.reduce((acc, item) => acc + Number(item.price) * item.qty, 0)
    ),
    shippingPrice = round2(itemsPrice > 100 ? 0 : 10),
    taxPrice = round2(itemsPrice * 0.15),
    totalPrice = round2(itemsPrice + shippingPrice + taxPrice);

  return {
    itemsPrice: itemsPrice.toFixed(2),
    shippingPrice: shippingPrice.toFixed(2),
    taxPrice: taxPrice.toFixed(2),
    totalPrice: totalPrice.toFixed(2),
  };
};

export async function addItemToCart(data: CartItem) {
  try {
    const sessionCartId = (await cookies()).get("sessionCartId")?.value;
    if (!sessionCartId) {
      return {
        success: false,
        message: "Cart session not found",
      };
    }

    const session = await auth();
    const userId = session?.user?.id ? (session.user.id as string) : undefined;

    const item = cartItemSchema.parse(data);

    // Step 4: Combine product check and cart fetch in parallel
    const [product, cart] = await Promise.all([
      prisma.product.findFirst({
        where: { id: item.productId },
        select: { id: true, stock: true, slug: true }, // Select only needed fields
      }),
      getMyCart(),
    ]);

    if (!product) {
      return {
        success: false,
        message: "Product not found",
      };
    }

    if (product.stock < item.qty) {
      return {
        success: false,
        message: `Only ${product.stock} items available in stock`,
      };
    }

    if (!cart) {
      // Create new cart
      const priceData = calcPrice([item]);

      await prisma.cart.create({
        data: {
          sessionCartId: sessionCartId,
          items: [item],
          itemsPrice: parseFloat(priceData.itemsPrice),
          shippingPrice: parseFloat(priceData.shippingPrice),
          taxPrice: parseFloat(priceData.taxPrice),
          totalPrice: parseFloat(priceData.totalPrice),
          ...(userId && {
            user: { connect: { id: userId } },
          }),
        },
      });

      // Step 4: Minimal revalidation
      revalidatePath(`/product/${product.slug}`);

      return {
        success: true,
        message: "Item added to cart",
      };
    } else {
      // Update existing cart
      const existingItems = cart.items as CartItem[];
      const existingItemIndex = existingItems.findIndex(
        (cartItem) => cartItem.productId === item.productId
      );

      let updatedItems: CartItem[];

      if (existingItemIndex !== -1) {
        const existingItem = existingItems[existingItemIndex];
        const newQuantity = existingItem.qty + item.qty;

        if (product.stock < newQuantity) {
          return {
            success: false,
            message: `Only ${product.stock} items available in stock`,
          };
        }

        updatedItems = existingItems.map((cartItem, index) =>
          index === existingItemIndex
            ? { ...cartItem, qty: newQuantity }
            : cartItem
        );
      } else {
        updatedItems = [...existingItems, item];
      }

      const priceData = calcPrice(updatedItems);

      await prisma.cart.update({
        where: { id: cart.id },
        data: {
          items: updatedItems,
          itemsPrice: parseFloat(priceData.itemsPrice),
          shippingPrice: parseFloat(priceData.shippingPrice),
          taxPrice: parseFloat(priceData.taxPrice),
          totalPrice: parseFloat(priceData.totalPrice),
        },
      });

      // Step 4: Minimal revalidation
      revalidatePath(`/product/${product.slug}`);

      return {
        success: true,
        message:
          existingItemIndex !== -1
            ? "Item quantity updated"
            : "Item added to cart",
      };
    }
  } catch (error) {
    console.error("Cart error:", error);
    return {
      success: false,
      message: formatError(error),
    };
  }
}

// get cart items
export async function getMyCart() {
  try {
    // check for cart cookie
    const sessionCartId = (await cookies()).get("sessionCartId")?.value;
    if (!sessionCartId) {
      return undefined;
    }

    // get session and user ID
    const session = await auth();
    const userId = session?.user?.id ? (session.user.id as string) : undefined;

    // get user cart from database
    const cart = await prisma.cart.findFirst({
      where: userId
        ? {
            user: { id: userId }, // Use relation instead of userId
          }
        : {
            sessionCartId: sessionCartId,
          },
      // No include needed since items is JSON field
    });

    if (!cart) return undefined;

    // Convert Decimal and return
    return convertToPlainObject({
      ...cart,
      items: cart.items as CartItem[], // Items are already JSON array
      itemsPrice: cart.itemsPrice.toString(),
      totalPrice: cart.totalPrice.toString(),
      shippingPrice: cart.shippingPrice.toString(),
      taxPrice: cart.taxPrice.toString(),
    });
  } catch (error) {
    console.error("Error getting cart:", error);
    return undefined;
  }
}

// Make sure you have this function in your cart.action.ts
export async function removeItemFromCart(productId: string) {
  try {
    const cart = await getMyCart();
    if (!cart) {
      return {
        success: false,
        message: "Cart not found",
      };
    }

    const updatedItems = cart.items.filter(
      (item) => item.productId !== productId
    );

    const priceData = calcPrice(updatedItems);

    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        items: updatedItems,
        itemsPrice: parseFloat(priceData.itemsPrice),
        shippingPrice: parseFloat(priceData.shippingPrice),
        taxPrice: parseFloat(priceData.taxPrice),
        totalPrice: parseFloat(priceData.totalPrice),
      },
    });

    // Step 4: Minimal revalidation
    revalidatePath("/cart");

    return {
      success: true,
      message: "Item removed from cart",
    };
  } catch (error) {
    console.error("Remove item error:", error);
    return {
      success: false,
      message: formatError(error),
    };
  }
}

// Step 4: Optimized updateItemQuantity
export async function updateItemQuantity(productId: string, qty: number) {
  try {
    // Step 4: Combine cart and product fetch in parallel
    const [cart, product] = await Promise.all([
      getMyCart(),
      prisma.product.findFirst({
        where: { id: productId },
        select: { id: true, stock: true }, // Select only needed fields
      }),
    ]);

    if (!cart) {
      return {
        success: false,
        message: "Cart not found",
      };
    }

    if (!product) {
      return {
        success: false,
        message: "Product not found",
      };
    }

    if (product.stock < qty) {
      return {
        success: false,
        message: `Only ${product.stock} items available in stock`,
      };
    }

    const updatedItems = cart.items.map((item) =>
      item.productId === productId ? { ...item, qty } : item
    );

    const priceData = calcPrice(updatedItems);

    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        items: updatedItems,
        itemsPrice: parseFloat(priceData.itemsPrice),
        shippingPrice: parseFloat(priceData.shippingPrice),
        taxPrice: parseFloat(priceData.taxPrice),
        totalPrice: parseFloat(priceData.totalPrice),
      },
    });

    // Step 4: Minimal revalidation
    revalidatePath("/cart");

    return {
      success: true,
      message: "Quantity updated",
    };
  } catch (error) {
    console.error("Update quantity error:", error);
    return {
      success: false,
      message: formatError(error),
    };
  }
}

// Add helper functions for increment/decrement
export async function incrementItemQuantity(productId: string) {
  try {
    const cart = await getMyCart();
    if (!cart) {
      return {
        success: false,
        message: "Cart not found",
      };
    }

    const item = cart.items.find((item) => item.productId === productId);
    if (!item) {
      return {
        success: false,
        message: "Item not found in cart",
      };
    }

    // Increment quantity by 1
    return await updateItemQuantity(productId, item.qty + 1);
  } catch (error) {
    console.error("Increment quantity error:", error);
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function decrementItemQuantity(productId: string) {
  try {
    const cart = await getMyCart();
    if (!cart) {
      return {
        success: false,
        message: "Cart not found",
      };
    }

    const item = cart.items.find((item) => item.productId === productId);
    if (!item) {
      return {
        success: false,
        message: "Item not found in cart",
      };
    }

    // Decrement quantity by 1, but don't go below 1
    const newQuantity = Math.max(1, item.qty - 1);
    return await updateItemQuantity(productId, newQuantity);
  } catch (error) {
    console.error("Decrement quantity error:", error);
    return {
      success: false,
      message: formatError(error),
    };
  }
}
