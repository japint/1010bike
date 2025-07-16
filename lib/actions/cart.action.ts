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
    // check for cart cookie
    const sessionCartId = (await cookies()).get("sessionCartId")?.value;
    if (!sessionCartId) {
      return {
        success: false,
        message: "Cart session not found",
      };
    }

    // get session and user ID
    const session = await auth();
    const userId = session?.user?.id ? (session.user.id as string) : undefined;

    // parse and validate item
    const item = cartItemSchema.parse(data);

    // find product in database
    const product = await prisma.product.findFirst({
      where: { id: item.productId },
    });

    if (!product) {
      return {
        success: false,
        message: "Product not found",
      };
    }

    // Check stock availability
    if (product.stock < item.qty) {
      return {
        success: false,
        message: `Only ${product.stock} items available in stock`,
      };
    }

    // get existing cart
    const cart = await getMyCart();

    if (!cart) {
      // create new cart with cart items
      const priceData = calcPrice([item]);

      await prisma.cart.create({
        data: {
          sessionCartId: sessionCartId,
          items: [item], // Store as JSON array
          itemsPrice: parseFloat(priceData.itemsPrice),
          shippingPrice: parseFloat(priceData.shippingPrice),
          taxPrice: parseFloat(priceData.taxPrice),
          totalPrice: parseFloat(priceData.totalPrice),
          // Connect to user if authenticated
          ...(userId && {
            user: {
              connect: { id: userId },
            },
          }),
        },
      });

      revalidatePath(`/product/${product.slug}`);
      return {
        success: true,
        message: "Item added to cart",
        item: data,
      };
    } else {
      // cart exists, update it
      const existingItems = cart.items as CartItem[];
      const existingItemIndex = existingItems.findIndex(
        (cartItem) => cartItem.productId === item.productId
      );

      let updatedItems: CartItem[];

      if (existingItemIndex !== -1) {
        // Check stock for updated quantity
        const existingItem = existingItems[existingItemIndex];
        const newQuantity = existingItem.qty + item.qty;

        if (product.stock < newQuantity) {
          return {
            success: false,
            message: `Only ${product.stock} items available in stock`,
          };
        }

        // update quantity of existing item
        updatedItems = existingItems.map((cartItem, index) =>
          index === existingItemIndex
            ? { ...cartItem, qty: newQuantity }
            : cartItem
        );
      } else {
        // add new item to cart
        updatedItems = [...existingItems, item];
      }

      // recalculate prices
      const priceData = calcPrice(updatedItems);

      // update cart
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

      revalidatePath(`/product/${product.slug}`);
      return {
        success: true,
        message:
          existingItemIndex !== -1
            ? "Item quantity updated"
            : "Item added to cart",
        item: data,
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

// Enhanced remove function with revalidation
export async function removeItemFromCart(productId: string) {
  try {
    const cart = await getMyCart();
    if (!cart) {
      return {
        success: false,
        message: "Cart not found",
      };
    }

    // Check if the item exists in the cart
    const itemExists = cart.items.find((item) => item.productId === productId);
    if (!itemExists) {
      return {
        success: false,
        message: "Item not found in cart",
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

    // Revalidate the cart page
    revalidatePath("/cart");

    return {
      success: true,
      message: "Item removed from cart",
      removedItem: itemExists,
    };
  } catch (error) {
    console.error("Remove item error:", error);
    return {
      success: false,
      message: formatError(error),
    };
  }
}

// Additional helper function for clearing entire cart
export async function clearCart() {
  try {
    const cart = await getMyCart();
    if (!cart) {
      return {
        success: false,
        message: "Cart not found",
      };
    }

    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        items: [],
        itemsPrice: 0,
        shippingPrice: 0,
        taxPrice: 0,
        totalPrice: 0,
      },
    });

    revalidatePath("/cart");

    return {
      success: true,
      message: "Cart cleared successfully",
    };
  } catch (error) {
    console.error("Clear cart error:", error);
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function updateItemQuantity(productId: string, qty: number) {
  try {
    const cart = await getMyCart();
    if (!cart) {
      return {
        success: false,
        message: "Cart not found",
      };
    }

    // Check if item exists in cart
    const itemExists = cart.items.find((item) => item.productId === productId);
    if (!itemExists) {
      return {
        success: false,
        message: "Item not found in cart",
      };
    }

    // If quantity is 0 or negative, remove the item
    if (qty <= 0) {
      return removeItemFromCart(productId);
    }

    // Check product stock availability
    const product = await prisma.product.findFirst({
      where: { id: productId },
    });

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

    // Update the item quantity
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

    // Revalidate the cart page
    revalidatePath("/cart");

    return {
      success: true,
      message: "Item quantity updated",
      item: updatedItems.find((item) => item.productId === productId),
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
