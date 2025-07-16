"use client";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Loader2 } from "lucide-react";
import { Cart, CartItem } from "@/types";
import { useToast } from "@/hooks/use-toast";
import {
  addItemToCart,
  removeItemFromCart,
  updateItemQuantity,
} from "@/lib/actions/cart.action";
import { useTransition } from "react";

const AddToCart = ({ cart, item }: { cart?: Cart; item: CartItem }) => {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Find if item exists in cart
  const existItem = cart?.items.find(
    (cartItem) => cartItem.productId === item.productId
  );

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
      toast({
        description: `${item.name} added to cart`,
      });
    });
  };

  const handleIncrement = async () => {
    if (!existItem) return;

    startTransition(async () => {
      const res = await updateItemQuantity(
        existItem.productId,
        existItem.qty + 1
      );
      if (!res || !res.success) {
        toast({
          variant: "destructive",
          description: res?.message || "Failed to update quantity.",
        });
        return;
      }
      toast({
        description: "Quantity updated",
      });
    });
  };

  const handleDecrement = async () => {
    if (!existItem) return;

    startTransition(async () => {
      if (existItem.qty === 1) {
        // If quantity is 1, remove item completely
        const res = await removeItemFromCart(existItem.productId);
        if (!res || !res.success) {
          toast({
            variant: "destructive",
            description: res?.message || "Failed to remove item.",
          });
          return;
        }
        toast({
          description: "Item removed from cart",
        });
      } else {
        // If quantity > 1, just decrease by 1
        const res = await updateItemQuantity(
          existItem.productId,
          existItem.qty - 1
        );
        if (!res || !res.success) {
          toast({
            variant: "destructive",
            description: res?.message || "Failed to update quantity.",
          });
          return;
        }
        toast({
          description: "Quantity updated",
        });
      }
    });
  };

  return existItem ? (
    <div className="flex items-center gap-2">
      <Button
        className="h-8 w-8"
        type="button"
        variant="outline"
        onClick={handleDecrement}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Minus className="h-4 w-4" />
        )}
      </Button>
      <span className="px-2 font-medium">{existItem.qty}</span>
      <Button
        className="h-8 w-8"
        type="button"
        variant="outline"
        onClick={handleIncrement}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
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
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
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
