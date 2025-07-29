const base = process.env.PAYPAL_API_URL || "https://api-m.sandbox.paypal.com";

export const paypal = {
  createOrder: async function createOrder(price: number) {
    console.log("PayPal createOrder called with price:", price); // Debug log

    const accessToken = await generateAccessToken();
    console.log("Access token generated:", accessToken ? "Yes" : "No"); // Debug log

    const url = `${base}/v2/checkout/orders`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: price,
            },
          },
        ],
      }),
    });

    console.log("PayPal API response status:", response.status); // Debug log
    const result = await handleResponse(response);
    console.log("PayPal order result:", result); // Debug log

    return result;
  },
  capturePayment: async function capturePayment(orderId: string) {
    const accessToken = await generateAccessToken();
    const url = `${base}/v2/checkout/orders/${orderId}/capture`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return handleResponse(response);
  },
};

// generate access token for PayPal API
async function generateAccessToken() {
  const { PAYPAL_CLIENT_ID, PAYPAL_APP_SECRET } = process.env;

  console.log("PayPal credentials check:", {
    clientId: PAYPAL_CLIENT_ID ? "Set" : "Missing",
    secret: PAYPAL_APP_SECRET ? "Set" : "Missing",
  }); // Debug log

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_APP_SECRET}`).toString(
    "base64"
  );

  const response = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    body: "grant_type=client_credentials",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  console.log("Access token response status:", response.status); // Debug log

  const jsonData = await handleResponse(response);
  console.log("Access token obtained:", jsonData.access_token ? "Yes" : "No"); // Debug log

  return jsonData.access_token;
}

async function handleResponse(response: Response) {
  if (response.ok) {
    return await response.json();
  } else {
    const errorMessage = await response.text();
    throw new Error(`Request failed: ${errorMessage}`);
  }
}

export { generateAccessToken };
