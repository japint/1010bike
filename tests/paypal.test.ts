import { generateAccessToken, paypal } from "../lib/paypal";

// test to generate access token for PayPal API
test("generates token from paypal", async () => {
  const tokenResponse = await generateAccessToken();
  console.log("tokenResponse:", tokenResponse);
  expect(typeof tokenResponse).toBe("string");
  expect(tokenResponse.length).toBeGreaterThan(0);
});

// test to create a PayPal order
test("create a paypal order", async () => {
  const token = await generateAccessToken();
  const price = 10.0; // Example price

  const orderResponse = await paypal.createOrder(price);
  console.log("orderResponse:", orderResponse);

  expect(orderResponse).toHaveProperty("id");
  expect(orderResponse).toHaveProperty("status");
  expect(orderResponse.status).toBe("CREATED");
});

// test to capture a payment with a mock order
test("simulate capturing a payment from an order", async () => {
  const orderId = "100"; // Replace with a valid order ID for real tests

  const mockCapturePayment = jest
    .spyOn(paypal, "capturePayment")
    .mockResolvedValueOnce({
      status: "COMPLETED",
    });
  const captureResponse = await paypal.capturePayment(orderId);
  expect(captureResponse).toHaveProperty("status", "COMPLETED");

  mockCapturePayment.mockRestore();
  // Log the mock capture payment response
  console.log("mockCapturePayment:", mockCapturePayment);
});
