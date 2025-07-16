"use client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Plus, Minus, Loader } from "lucide-react";
import { Cart, CartItem } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import {
  addItemToCart,
  decrementItemQuantity,
  incrementItemQuantity,
} from "@/lib/actions/cart.action";
import { useTransition } from "react";

const AddToCart = ({ cart, item }: { cart?: Cart; item: CartItem }) => {
  const router = useRouter();
  const { toast } = useToast();

  const [isPending, startTransition] = useTransition();

  const handleAddToCart = async () => {
    startTransition(async () => {
      const res = await addItemToCart(item);
      if (!res || !res.success) {
        toast({
          variant: "destructive",
          description: res?.message || "Failed to add item to cart.",
        });
        return;
      }
      // handle success add to cart
      toast({
        description: `${item.name} added to cart`,
        action: (
          <ToastAction
            className="bg-primary text-white hover:bg-gray-800 "
            altText="Go to Cart"
            onClick={() => router.push("/cart")}
          >
            Go to Cart
          </ToastAction>
        ),
      });
    });
  };

  // handle increment quantity
  const handleIncrementQuantity = async () => {
    startTransition(async () => {
      const res = await incrementItemQuantity(item.productId);
      if (!res || !res.success) {
        toast({
          variant: "destructive",
          description: res?.message || "Failed to update quantity.",
        });
        return;
      }
      toast({
        description: `${item.name} quantity updated`,
      });
    });
  };

  // handle decrement quantity
  const handleDecrementQuantity = async () => {
    startTransition(async () => {
      const res = await decrementItemQuantity(item.productId);
      if (!res || !res.success) {
        toast({
          variant: "destructive",
          description: res?.message || "Failed to update quantity.",
        });
        return;
      }
      toast({
        description: `${item.name} quantity updated`,
      });
    });
  };

  // check if item already exists in cart
  const existItem =
    cart &&
    cart.items.find((cartItem) => cartItem.productId === item.productId);

  return existItem ? (
    <div className="flex items-center gap-2">
      <Button
        className="h-8 w-8"
        type="button"
        variant="outline"
        onClick={handleDecrementQuantity}
        disabled={isPending}
      >
        {isPending ? (
          <Loader className="w-4 h-4 animate-spin" />
        ) : (
          <Minus className="h-4 w-4" />
        )}
      </Button>
      <span className="px-2 font-medium">{existItem.qty}</span>
      <Button
        className="h-8 w-8"
        type="button"
        variant="outline"
        onClick={handleIncrementQuantity}
        disabled={isPending}
      >
        {isPending ? (
          <Loader className="w-4 h-4 animate-spin" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
      </Button>
    </div>
  ) : (
    <Button
      className="w-full"
      type="button"
      onClick={handleAddToCart}
      disabled={isPending}
    >
      {isPending ? (
        <>
          <Loader className="w-4 h-4 animate-spin mr-2" />
          Adding...
        </>
      ) : (
        <>
          <Plus className="h-4 w-4 mr-2" />
          Add To Cart
        </>
      )}
    </Button>
  );
};

export default AddToCart;
