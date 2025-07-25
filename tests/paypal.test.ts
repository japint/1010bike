import { generateAccessToken } from "../lib/paypal";
// test to generate access token for PayPal API
test("generateAccessToken", async () => {
  const tokenResponse = await generateAccessToken();
  console.log(tokenResponse);
  expect(typeof tokenResponse).toBe("string");
  expect(tokenResponse.length).toBeGreaterThan(0);
});
