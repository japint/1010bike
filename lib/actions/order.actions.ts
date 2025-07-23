"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { convertToPlainObject, formatError } from "../utils";
import { auth } from "@/auth";
import { getMyCart } from "./cart.action";
import { getUserById } from "./user.action";
import { insertOrderSchema } from "../validators";
import { prisma } from "@/db/prisma";
import { CartItem } from "@/types";

// create order and create the order items
export const createOrder = async () => {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("User not authenticated");

    const cart = await getMyCart();
    const userId = session.user.id;
    if (!userId) throw new Error("User not found");

    const user = await getUserById(userId);

    if (!cart || cart.items.length === 0) {
      return {
        success: false,
        message: "Your cart is empty",
        redirectTo: "/cart",
      };
    }

    if (!user.address) {
      return {
        success: false,
        message: "Please provide a shipping address",
        redirectTo: "/shipping-address",
      };
    }

    if (!user.paymentMethod) {
      return {
        success: false,
        message: "Please provide a payment method",
        redirectTo: "/payment-method",
      };
    }

    // create order object
    const order = insertOrderSchema.parse({
      userId: user.id,
      shippingAddress: user.address,
      paymentMethod: user.paymentMethod,
      itemsPrice: cart.itemsPrice,
      shippingPrice: cart.shippingPrice,
      taxPrice: cart.taxPrice,
      totalPrice: cart.totalPrice,
    });
    // create a transaction to create order and order items
    const insertedOrder = await prisma.$transaction(async (tx) => {
      // Create the order
      const newOrder = await tx.order.create({
        data: order,
      });
      //   Create order items from the cart items
      for (const item of cart.items as CartItem[]) {
        await tx.orderItem.create({
          data: { ...item, price: item.price, orderId: newOrder.id },
        });
      }
      //   create cart
      await tx.cart.update({
        where: { id: cart.id },
        data: {
          items: [],
          totalPrice: 0,
          taxPrice: 0,
          shippingPrice: 0,
          itemsPrice: 0,
        },
      });

      return newOrder;
    });
    if (!insertedOrder) {
      throw new Error("Order creation failed");
    }

    return {
      success: true,
      message: "Order created successfully",
      orderId: insertedOrder.id.toString(),
      redirectTo: `/order/${insertedOrder.id.toString()}`,
    };
  } catch (error) {
    if (isRedirectError(error)) {
      return {
        success: false,
        message: formatError(error),
      };
    }
  }
};

// get order by ID
export async function getOrderById(orderId: string) {
  const data = await prisma.order.findFirst({
    where: { id: orderId },
    include: {
      user: true,
      orderItems: true,
    },
  });

  return convertToPlainObject(data);
}
