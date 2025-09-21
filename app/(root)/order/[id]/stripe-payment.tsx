const StripePayment = ({
  priceInCents,
  orderId,
  clientSecret,
}: {
  priceInCents: number;
  orderId: string;
  clientSecret: string;
}) => {
  return (
    <>
      <h1>STRIPE FORM</h1>
    </>
  );
};

export default StripePayment;
