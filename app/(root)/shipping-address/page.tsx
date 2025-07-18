import { auth } from "@/auth";
import { getMyCart } from "@/lib/actions/cart.action";
import { getUserById } from "@/lib/actions/user.action";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import ShippingAddressForm from "./shipping-address-form";
import { ShippingAddress } from "@/types";
import CheckoutSteps from "@/components/shared/checkout-steps";

export const metadata: Metadata = {
  title: "Shipping Address",
};

// Add this line to make the page dynamic
export const dynamic = "force-dynamic";

const ShippingAddressPage = async () => {
  try {
    const cart = await getMyCart();
    if (!cart || cart.items.length === 0) {
      redirect("/cart");
    }

    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      redirect("/sign-in");
    }

    const user = await getUserById(userId);

    return (
      <>
        <CheckoutSteps current={1} />
        <ShippingAddressForm address={user.address as ShippingAddress} />
      </>
    );
  } catch (error) {
    console.error("Shipping address page error:", error);
    redirect("/cart");
  }
};

export default ShippingAddressPage;
