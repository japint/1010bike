"use client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Plus, Minus } from "lucide-react";
import { Cart, CartItem } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { addItemToCart, removeItemFromCart } from "@/lib/actions/cart.action";

const AddToCart = ({ cart, item }: { cart?: Cart; item: CartItem }) => {
  const router = useRouter();
  const { toast } = useToast();

  const handleAddToCart = async () => {
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
  };

  // handle remove from cart
  const handleRemoveFromCart = async () => {
    const res = await removeItemFromCart(item.productId);

    toast({
      variant: res.success ? "default" : "destructive",
      description: res.message,
    });
  };

  // check if item already exists in cart
  const existItem =
    cart &&
    cart.items.find((cartItem) => cartItem.productId === item.productId);

  return existItem ? (
    <div>
      <Button
        className="h-4 w-4"
        type="button"
        variant="outline"
        onClick={handleRemoveFromCart}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <span className="px-2">{existItem.qty}</span>
      <Button type="button" onClick={handleAddToCart}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  ) : (
    <Button className="w-full " type="button" onClick={handleAddToCart}>
      <Plus />
      Add To Cart
    </Button>
  );
};

export default AddToCart;
