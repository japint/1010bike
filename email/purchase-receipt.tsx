import { Order } from "@/types";

const PurchaseReceiptEmail = ({ order }: { order: Order }) => {
  return (
    <div>
      <h1>Your Purchase Receipt</h1>
      <p>Thank you for your order!</p>
    </div>
  );
};

export default PurchaseReceiptEmail;
