"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Loader } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { createOrder } from "@/lib/actions/order.actions";

const PlaceOrderForm = () => {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const handlePlaceOrder = () => {
    startTransition(async () => {
      try {
        const result = await createOrder();

        if (!result || !result.success) {
          toast({
            variant: "destructive",
            description: result?.message || "Order creation failed.",
          });

          if (result?.redirectTo) {
            router.push(result.redirectTo);
          }
          return;
        }

        toast({
          description: result.message,
        });

        // Redirect to order confirmation page with proper ID
        if (result.orderId) {
          const orderUrl = `/order/${result.orderId}`;
          router.push(orderUrl);
        } else if (result.redirectTo) {
          router.push(result.redirectTo);
        } else {
          // Fallback
          router.push("/orders");
        }
      } catch (error) {
        console.error("❌ Place order error:", error);
        toast({
          variant: "destructive",
          description: "Failed to place order. Please try again.",
        });
      }
    });
  };

  return (
    <Button
      onClick={handlePlaceOrder}
      disabled={isPending}
      className="w-full"
      size="lg"
    >
      {isPending ? (
        <>
          <Loader className="w-4 h-4 animate-spin mr-2" />
          Placing Order...
        </>
      ) : (
        "Place Order"
      )}
    </Button>
  );
};

export default PlaceOrderForm;
