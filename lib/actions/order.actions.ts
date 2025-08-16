"use server";

import { isRedirectError } from "next/dist/client/components/redirect-error";
import { convertToPlainObject, formatError } from "../utils";
import { auth } from "@/auth";
import { getMyCart } from "./cart.action";
import { getUserById } from "./user.action";
import { insertOrderSchema } from "../validators";
import { prisma } from "@/db/prisma";
import { Decimal } from "@prisma/client/runtime/library";
import { CartItem, ShippingAddress, PaymentResult } from "@/types";
import { paypal } from "../paypal";
import { revalidatePath } from "next/cache";
import { PAGE_SIZE } from "../constants";
import { Prisma } from "@prisma/client";

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
  try {
    // Check if prisma client is properly initialized
    if (!prisma) {
      console.error("Prisma client not initialized");
      return null;
    }

    const data = await prisma.order.findFirst({
      where: { id: orderId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        orderitems: true,
      },
    });

    if (!data) return null;

    // Convert the data to match the Order type
    const convertedOrder = {
      id: data.id,
      userId: data.userId,
      itemsPrice: data.itemsPrice.toString(),
      shippingPrice: data.shippingPrice.toString(),
      taxPrice: data.taxPrice.toString(),
      totalPrice: data.totalPrice.toString(),
      paymentMethod: data.paymentMethod,
      shippingAddress: data.shippingAddress as ShippingAddress, // Cast JSON to ShippingAddress type
      createdAt: data.createdAt,
      isPaid: data.isPaid,
      paidAt: null, // Field doesn't exist in schema, set to null
      isDelivered: data.isDelivered,
      deliveredAt: data.deliveredAt,
      orderitems: data.orderitems.map(
        (item: {
          productId: string;
          slug: string;
          image: string;
          name: string;
          price: Decimal;
          qty: number;
        }) => ({
          productId: item.productId,
          slug: item.slug,
          image: item.image,
          name: item.name,
          price: item.price.toString(),
          qty: item.qty,
        })
      ),
      user: data.user,
    };

    return convertToPlainObject(convertedOrder);
  } catch (error) {
    console.error("Error fetching order by ID:", error);
    // Return null as fallback to prevent app crash
    return null;
  } finally {
    // Only disconnect if prisma client exists and has the method
    try {
      if (prisma && typeof prisma.$disconnect === "function") {
        await prisma.$disconnect();
      }
    } catch (disconnectError) {
      console.error("Error disconnecting from database:", disconnectError);
    }
  }
}

// create a new paypal order
export const createPaypalOrder = async (orderId: string) => {
  try {
    // get order from database
    const order = await prisma.order.findFirst({
      where: { id: orderId },
    });

    if (order) {
      // Create PayPal order
      const paypalOrder = await paypal.createOrder(Number(order.totalPrice));

      // update order with PayPal order ID
      await prisma.order.update({
        where: { id: orderId },
        data: {
          paymentResult: {
            id: paypalOrder.id,
            email_address: "", // Assuming user email is available in order
            status: "",
            pricePaid: 0, // Set to 0 initially, will be updated after capture
          },
        },
      });

      return {
        success: true,
        message: "Item order created successfully",
        data: paypalOrder.id,
      };
    } else {
      throw new Error("Order not found");
    }
  } catch (error) {
    console.error("Error creating PayPal order:", error);
    return {
      success: false,
      message: formatError(error),
    };
  }
};

// approved paypal order and update order to paid
export const approvePaypalOrder = async (
  orderId: string,
  data: { orderID: string }
) => {
  try {
    // get order from database
    const order = await prisma.order.findFirst({
      where: { id: orderId },
    });
    if (!order) throw new Error("Order not found");

    // Capture the payment
    const captureData = await paypal.capturePayment(data.orderID);

    if (
      !captureData ||
      captureData.id !== (order.paymentResult as PaymentResult)?.id ||
      captureData.status !== "COMPLETED"
    ) {
      throw new Error("Error in PayPal payment");
    }

    // Update order to paid
    const updatedOrder = await updateOrderToPaid(orderId, {
      status: captureData.status,
      email_address: captureData.payer.email_address,
      id: captureData.id,
      pricePaid:
        captureData.purchase_units[0].payments?.captures[0]?.amount?.value,
    });

    revalidatePath(`/order/${orderId}`);

    return {
      success: true,
      message: "Your order has been approved",
      data: updatedOrder, // Return the updated order data
    };
  } catch (error) {
    console.error("Error approving PayPal order:", error);
    return {
      success: false,
      message: formatError(error),
    };
  }
};

// @todo: Update the order with payment details

// update order to paid
const updateOrderToPaid = async (
  orderId: string,
  paymentResult?: PaymentResult
) => {
  try {
    // get order from database
    const order = await prisma.order.findFirst({
      where: { id: orderId },
      include: {
        orderitems: true,
      },
    });
    if (!order) throw new Error("Order not found");

    if (order.isPaid) throw new Error("Order is already paid");

    // transaction to update order and account for product stock
    await prisma.$transaction(async (tx) => {
      // iterate over products and update stock
      for (const item of order.orderitems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              increment: -item.qty,
            },
          },
        });
      }

      // set the order to paid
      await tx.order.update({
        where: { id: orderId },
        data: {
          isPaid: true,
          paidAt: new Date(),
          paymentResult,
        },
      });
    });

    // get updated order after transaction
    const updatedOrder = await prisma.order.findFirst({
      where: { id: orderId },
      include: {
        orderitems: true,
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });
    if (!updatedOrder) throw new Error("Updated order not found");

    // Convert the data to match the Order type (similar to getOrderById)
    const convertedOrder = {
      id: updatedOrder.id,
      userId: updatedOrder.userId,
      itemsPrice: updatedOrder.itemsPrice.toString(),
      shippingPrice: updatedOrder.shippingPrice.toString(),
      taxPrice: updatedOrder.taxPrice.toString(),
      totalPrice: updatedOrder.totalPrice.toString(),
      paymentMethod: updatedOrder.paymentMethod,
      shippingAddress: updatedOrder.shippingAddress as ShippingAddress,
      createdAt: updatedOrder.createdAt,
      isPaid: updatedOrder.isPaid,
      paidAt: updatedOrder.paidAt,
      isDelivered: updatedOrder.isDelivered,
      deliveredAt: updatedOrder.deliveredAt,
      orderitems: updatedOrder.orderitems.map(
        (item: {
          productId: string;
          slug: string;
          image: string;
          name: string;
          price: Decimal;
          qty: number;
        }) => ({
          productId: item.productId,
          slug: item.slug,
          image: item.image,
          name: item.name,
          price: item.price.toString(),
          qty: item.qty,
        })
      ),
      user: updatedOrder.user,
    };

    return convertToPlainObject(convertedOrder);
  } catch (error) {
    console.error("Error updating order to paid:", error);
    throw error;
  }
};

// get users orders
export const getMyOrders = async ({
  limit = PAGE_SIZE,
  page,
}: {
  limit?: number;
  page: number;
}) => {
  const session = await auth();
  if (!session) throw new Error("User not authenticated");

  const data = await prisma.order.findMany({
    where: { userId: session.user.id! },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: (page - 1) * limit,
  });

  const dataCount = await prisma.order.count({
    where: { userId: session.user.id! },
  });

  return { data, totalPages: Math.ceil(dataCount / limit) };
};

type SalesDataType = {
  month: string;
  totalSales: number;
}[];

// Get sales data and order summary
export async function getOrderSummary() {
  // Get counts for each resource
  const ordersCount = await prisma.order.count();
  const productsCount = await prisma.product.count();
  const usersCount = await prisma.user.count();

  // Calculate the total sales
  const totalSales = await prisma.order.aggregate({
    _sum: { totalPrice: true },
  });

  // Get monthly sales
  const salesDataRaw = await prisma.$queryRaw<
    Array<{ month: string; totalSales: Prisma.Decimal }>
  >`SELECT to_char("createdAt", 'MM/YY') as "month", sum("totalPrice") as "totalSales" FROM "Order" GROUP BY to_char("createdAt", 'MM/YY')`;

  const salesData: SalesDataType = salesDataRaw.map((entry) => ({
    month: entry.month,
    totalSales: Number(entry.totalSales),
  }));

  // Get latest sales
  const latestSales = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true } },
    },
    take: 6,
  });

  return {
    ordersCount,
    productsCount,
    usersCount,
    totalSales,
    latestSales,
    salesData,
  };
}

// get all orders
export async function getAllOrders({
  limit = PAGE_SIZE,
  page,
}: {
  limit?: number;
  page: number;
}) {
  const data = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: (page - 1) * limit,
    include: {
      user: {
        select: { name: true },
      },
    },
  });

  const dataCount = await prisma.order.count();

  return { data, totalPages: Math.ceil(dataCount / limit) };
}

// delete an order
export async function deleteOrder(id: string) {
  try {
    await prisma.order.delete({
      where: { id },
    });
    revalidatePath("/admin/orders");
    return { success: true, message: "Order deleted successfully" };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}
