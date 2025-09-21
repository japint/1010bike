import { cn } from "@/lib/utils";

const ProductPrice = ({
  value,
  className,
}: {
  value: number;
  className?: string;
}) => {
  // Format value to two decimal places and split into integer and decimal
  const [peso, decimal] = value.toFixed(2).split(".");

  return (
    <p className={cn("text-2xl", className)}>
      <span className="text-xs align-super">₱</span>
      {Number(peso).toLocaleString("en-US")}
      <span className="text-xs align-super">.{decimal}</span>
    </p>
  );
};

export default ProductPrice;
