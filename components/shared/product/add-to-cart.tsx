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
import {
  useTransition,
  useOptimistic,
  useMemo,
  useCallback,
  useRef,
  useEffect, // Add this import
} from "react";

const AddToCart = ({ cart, item }: { cart?: Cart; item: CartItem }) => {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Step 3: Add refs for debouncing
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActionRef = useRef<string | null>(null);

  // Step 1: Add optimistic updates for instant UI feedback
  const [optimisticCart, updateOptimisticCart] = useOptimistic(
    cart,
    (
      state,
      action: {
        type: "add" | "increment" | "decrement" | "remove";
        productId: string;
      }
    ) => {
      if (!state) return state;

      const items = [...state.items];
      const existingIndex = items.findIndex(
        (item) => item.productId === action.productId
      );

      switch (action.type) {
        case "add":
          if (existingIndex === -1) {
            items.push({ ...item, qty: 1 });
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
              items.splice(existingIndex, 1); // Remove item
            } else {
              items[existingIndex] = { ...items[existingIndex], qty: newQty };
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

  // Step 2: Memoize existing item calculation
  const existItem = useMemo(
    () =>
      optimisticCart?.items.find(
        (cartItem) => cartItem.productId === item.productId
      ),
    [optimisticCart?.items, item.productId]
  );

  // Step 3: Debounced toast function to prevent spam
  const showDebouncedToast = useCallback(
    (message: string, variant: "default" | "destructive" = "default") => {
      // Clear previous timeout
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }

      // Only show toast if it's different from last action
      if (lastActionRef.current !== message) {
        lastActionRef.current = message;

        // Debounce toast messages
        toastTimeoutRef.current = setTimeout(() => {
          toast({
            variant,
            description: message,
            duration: 2000, // Shorter duration for better UX
          });
        }, 300); // 300ms debounce
      }
    },
    [toast]
  );

  // Step 3: Immediate error toast (no debounce for errors)
  const showErrorToast = useCallback(
    (message: string) => {
      toast({
        variant: "destructive",
        description: message,
        duration: 4000, // Longer duration for errors
      });
    },
    [toast]
  );

  // Step 2: Memoize handlers to prevent recreation on every render
  const handleAddToCart = useCallback(async () => {
    startTransition(async () => {
      // Update UI immediately inside transition
      updateOptimisticCart({ type: "add", productId: item.productId });

      const res = await addItemToCart(item);
      if (!res || !res.success) {
        showErrorToast(res?.message || "Failed to add item to cart.");
        return;
      }
      // Step 3: Only show success toast for add action
      showDebouncedToast(`${item.name} added to cart`);
    });
  }, [item, updateOptimisticCart, showDebouncedToast, showErrorToast]);

  const handleIncrement = useCallback(async () => {
    if (!existItem) return;

    startTransition(async () => {
      // Update UI immediately inside transition
      updateOptimisticCart({
        type: "increment",
        productId: existItem.productId,
      });

      const res = await updateItemQuantity(
        existItem.productId,
        existItem.qty + 1
      );
      if (!res || !res.success) {
        showErrorToast(res?.message || "Failed to update quantity.");
        return;
      }
      // Step 3: Minimal feedback for increment
      showDebouncedToast("Quantity updated");
    });
  }, [existItem, updateOptimisticCart, showDebouncedToast, showErrorToast]);

  const handleDecrement = useCallback(async () => {
    if (!existItem) return;

    startTransition(async () => {
      // Update UI immediately inside transition
      if (existItem.qty === 1) {
        updateOptimisticCart({
          type: "remove",
          productId: existItem.productId,
        });
      } else {
        updateOptimisticCart({
          type: "decrement",
          productId: existItem.productId,
        });
      }

      if (existItem.qty === 1) {
        // If quantity is 1, remove item completely
        const res = await removeItemFromCart(existItem.productId);
        if (!res || !res.success) {
          showErrorToast(res?.message || "Failed to remove item.");
          return;
        }
        // Step 3: Show removal message only once
        showDebouncedToast("Item removed from cart");
      } else {
        // If quantity > 1, just decrease by 1
        const res = await updateItemQuantity(
          existItem.productId,
          existItem.qty - 1
        );
        if (!res || !res.success) {
          showErrorToast(res?.message || "Failed to update quantity.");
          return;
        }
        // Step 3: Minimal feedback for decrement
        showDebouncedToast("Quantity updated");
      }
    });
  }, [existItem, updateOptimisticCart, showDebouncedToast, showErrorToast]);

  // Step 2: Memoize button content to prevent recreation
  const buttonContent = useMemo(() => {
    if (isPending) {
      return (
        <>
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Adding...
        </>
      );
    }
    return (
      <>
        <Plus className="h-4 w-4 mr-2" />
        Add To Cart
      </>
    );
  }, [isPending]);

  // Step 3: Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

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
      {buttonContent}
    </Button>
  );
};

export default AddToCart;
