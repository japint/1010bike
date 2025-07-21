export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "1010 Bike";
export const APP_DESCRIPTION =
  process.env.NEXT_PUBLIC_APP_DESCRIPTION ||
  "A modern ecommerce platform built with Next.js";
export const SERVER_URL =
  process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";
export const LATEST_PRODUCTS_LIMIT = 4;
export const FEATURED_PRODUCTS_LIMIT =
  Number(process.env.NEXT_PUBLIC_FEATURED_PRODUCTS_LIMIT) || 4;

export const signInDefaultValues = {
  email: "",
  password: "",
};

export const signUpDefaultValues = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export const shippingAddressDefaultValues = {
  fullName: "",
  streetAddress: "",
  city: "",
  postalCode: "",
  country: "",
};

export const PAYMENT_METHOD = process.env.PAYMENT_METHODS
  ? process.env.PAYMENT_METHODS.split(", ")
  : ["Paypal", "Stripe", "CashOnDelivery"];
export const DEFAULT_PAYMENT_METHOD = process.env.DEFAULT_PAYMENT || "Paypal";
