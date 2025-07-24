import { Metadata } from "next";
import { getOrderById } from "@/lib/actions/order.actions";
import { notFound } from "next/navigation";
import { formatCurrency, formatDateTime, formatId } from "@/lib/utils";
// import { ShippingAddress } from "@/types";

export const metadata: Metadata = {
  title: "Order Details",
};

const OrderDetailsPage = async (props: { params: Promise<{ id: string }> }) => {
  const { id } = await props.params;

  const order = await getOrderById(id);
  if (!order) {
    notFound();
  }

  const { dateTime: orderDate } = formatDateTime(order.createdAt);
  const deliveredDate = order.deliveredAt
    ? formatDateTime(order.deliveredAt).dateTime
    : "Not delivered yet";

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Order Details</h1>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Order #{formatId(order.id)}</h1>
        <p className="text-muted-foreground">Placed on {orderDate}</p>
      </div>
      <div className="bg-gray-100 p-4 rounded">
        <span>Status:</span>
        <span className="font-medium">
          {order.isPaid ? (
            <span className="text-green-600">Paid</span>
          ) : (
            <span className="text-yellow-600">Pending</span>
          )}
        </span>
        <p>
          <strong>Order ID:</strong> {id}
        </p>
        <p>
          <strong>ID Type:</strong> {typeof id}
        </p>
        <p>
          <strong>Total Price:</strong>{" "}
          {formatCurrency(Number(order.totalPrice))}
        </p>
        <p className="text-muted-foreground mt-1">
          {order.isDelivered ? (
            <span className="text-green-600">Delivered on {deliveredDate}</span>
          ) : (
            <span className="text-yellow-600">Processing</span>
          )}
        </p>
      </div>
    </div>
  );
};

export default OrderDetailsPage;
