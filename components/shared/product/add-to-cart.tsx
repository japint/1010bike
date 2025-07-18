"use client";
import { Button } from "@/components/ui/button";
import { Plus, Minus, Loader2 } from "lucide-react";
import { Cart, CartItem } from "@/types";
import { useToast } from "@/hooks/use-toast";
import {
  addItemToCart,
  removeItemFromCart,
  incrementItemQuantity,
  decrementItemQuantity,
} from "@/lib/actions/cart.action";
import { useTransition, useOptimistic, useMemo, useCallback } from "react";

const AddToCart = ({ cart, item }: { cart?: Cart; item: CartItem }) => {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Optimistic state for instant UI updates
  const [optimisticCart, updateOptimisticCart] = useOptimistic(
    cart,
    (state, action: { type: string; productId: string }) => {
      if (!state) return state;

      const items = [...state.items];
      const existingIndex = items.findIndex(
        (cartItem) => cartItem.productId === action.productId
      );

      switch (action.type) {
        case "add":
          if (existingIndex === -1) {
            items.push({ ...item, qty: 1 });
          } else {
            items[existingIndex] = {
              ...items[existingIndex],
              qty: items[existingIndex].qty + 1,
            };
          }
          break;
        case "increment":
          if (existingIndex !== -1) {
            items[existingIndex] = {
              ...items[existingIndex],
              qty: items[existingIndex].qty + 1,
            };
          }
          break;
        case "decrement":
          if (existingIndex !== -1) {
            const newQty = items[existingIndex].qty - 1;
            if (newQty <= 0) {
              items.splice(existingIndex, 1);
            } else {
              items[existingIndex] = {
                ...items[existingIndex],
                qty: newQty,
              };
            }
          }
          break;
        case "remove":
          if (existingIndex !== -1) {
            items.splice(existingIndex, 1);
          }
          break;
      }

      return { ...state, items };
    }
  );

  // Find existing item
  const existItem = useMemo(
    () =>
      optimisticCart?.items.find(
        (cartItem) => cartItem.productId === item.productId
      ),
    [optimisticCart?.items, item.productId]
  );

  // Add to cart handler
  const handleAddToCart = useCallback(() => {
    startTransition(async () => {
      // Update UI immediately
      updateOptimisticCart({ type: "add", productId: item.productId });

      try {
        const res = await addItemToCart(item);
        if (!res.success) {
          toast({
            variant: "destructive",
            description: res.message,
          });
        } else {
          toast({
            description: `${item.name} added to cart`,
          });
        }
      } catch (error) {
        console.error("Add to cart error:", error);
        toast({
          variant: "destructive",
          description: "Failed to add item to cart",
        });
      }
    });
  }, [item, updateOptimisticCart, toast]);

  // Increment quantity handler
  const handleIncrement = useCallback(() => {
    if (!existItem) return;

    startTransition(async () => {
      // Update UI immediately
      updateOptimisticCart({
        type: "increment",
        productId: existItem.productId,
      });

      try {
        const res = await incrementItemQuantity(existItem.productId);
        if (!res.success) {
          toast({
            variant: "destructive",
            description: res.message,
          });
        }
      } catch (error) {
        console.error("Increment error:", error);
        toast({
          variant: "destructive",
          description: "Failed to update quantity",
        });
      }
    });
  }, [existItem, updateOptimisticCart, toast]);

  // Decrement quantity handler
  const handleDecrement = useCallback(() => {
    if (!existItem) return;

    startTransition(async () => {
      if (existItem.qty === 1) {
        // Remove item if quantity is 1
        updateOptimisticCart({
          type: "remove",
          productId: existItem.productId,
        });

        try {
          const res = await removeItemFromCart(existItem.productId);
          if (!res.success) {
            toast({
              variant: "destructive",
              description: res.message,
            });
          } else {
            toast({
              description: "Item removed from cart",
            });
          }
        } catch (error) {
          console.error("Remove error:", error);
          toast({
            variant: "destructive",
            description: "Failed to remove item",
          });
        }
      } else {
        // Decrease quantity
        updateOptimisticCart({
          type: "decrement",
          productId: existItem.productId,
        });

        try {
          const res = await decrementItemQuantity(existItem.productId);
          if (!res.success) {
            toast({
              variant: "destructive",
              description: res.message,
            });
          }
        } catch (error) {
          console.error("Decrement error:", error);
          toast({
            variant: "destructive",
            description: "Failed to update quantity",
          });
        }
      }
    });
  }, [existItem, updateOptimisticCart, toast]);

  // Render quantity controls if item exists in cart
  if (existItem) {
    return (
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleDecrement}
          disabled={isPending}
          className="h-8 w-8 p-0"
        >
          {isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Minus className="h-3 w-3" />
          )}
        </Button>

        <span className="min-w-[2rem] text-center font-medium">
          {existItem.qty}
        </span>

        <Button
          size="sm"
          variant="outline"
          onClick={handleIncrement}
          disabled={isPending}
          className="h-8 w-8 p-0"
        >
          {isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Plus className="h-3 w-3" />
          )}
        </Button>
      </div>
    );
  }

  // Render add to cart button
  return (
    <Button
      onClick={handleAddToCart}
      disabled={isPending}
      className="w-full"
      size="sm"
    >
      {isPending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
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
