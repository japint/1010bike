import { Metadata } from "next";
// import { orderById } from "@/lib/actions/order.actions";
// import { notFound } from "next/navigation";
// import { ShippingAddress } from "@/types";

export const metadata: Metadata = {
  title: "Order Details",
};

const OrderDetailsPage = async (props: { params: Promise<{ id: string }> }) => {
  const { id } = await props.params;

  console.log("🆔 Order page - Raw params:", props.params);
  console.log("🔍 Order page - Extracted ID:", id);
  console.log("🏷️ Order page - ID type:", typeof id);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Order Details</h1>
      <div className="bg-gray-100 p-4 rounded">
        <p>
          <strong>Order ID:</strong> {id}
        </p>
        <p>
          <strong>ID Type:</strong> {typeof id}
        </p>
      </div>
    </div>
  );
};

export default OrderDetailsPage;
