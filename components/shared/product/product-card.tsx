import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import ProductPrice from "./product-price";
import { Product } from "@/types";
import Rating from "./rating";

const ProductCard = ({ product }: { product: Product }) => {
  if (!product || !product.slug || !product.images?.[0] || !product.name) {
    // Optionally return fallback UI or nothing
    return null;
  }
  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="p-0 items-center">
        <Link href={`/product/${product.slug}`}>
          <Image
            src={product.images[0]}
            alt={product.name}
            width={300}
            height={300}
            priority={true}
          />
        </Link>
      </CardHeader>
      <CardContent className="p-4 gird gap-4">
        <div className="text-sx">{product.brand}</div>
        <Link href={`/product/${product.slug}`}>
          <h3 className="text-sm font-medium">{product.name}</h3>
        </Link>
        <div className="flex-between gap-4">
          <Rating value={Number(product.rating)} />
          {product.stock > 0 ? (
            <ProductPrice value={Number(product.price)} />
          ) : (
            <p className="text-destructive">Out Of Stock</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
export default ProductCard;
