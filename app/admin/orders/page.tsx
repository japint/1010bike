import { auth } from "@/auth";
import { getAllOrders } from "@/lib/actions/order.actions";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Orders",
  description: "Manage orders in the admin panel",
};

const AdminOrdersPage = async (props: {
  searchParams: Promise<{ page?: string }>;
}) => {
  const { page = "1" } = await props.searchParams;

  const session = await auth();
  if (session?.user?.role !== "admin") throw new Error("Access Denied");

  const orders = await getAllOrders({
    page: Number(page),
    limit: 2,
  });

  console.log(orders);

  return <>Orders</>;
};

export default AdminOrdersPage;
