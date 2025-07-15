import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// convert a prisma object into a JS object
export function convertToPlainObject<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

// format number with decimal places
export function formatNumberWithDecimal(num: number): string {
  const [int, decimal] = num.toString().split(".");
  return decimal ? `${int}.${decimal.padEnd(2, "0")}` : `${int}.00`;
}

// format error message
export function formatError(error: unknown): string {
  // Check if error is null or undefined first
  if (!error) {
    return "An unexpected error occurred";
  }

  // Check if error is an object with properties
  if (typeof error === "object" && error !== null) {
    const err = error as Record<string, unknown>;

    if (err.name === "ZodError" && err.issues) {
      // handle Zod validation errors
      const issues = err.issues as Array<{ message: string; path: string[] }>;
      const fieldErrors = issues.map((issue) => issue.message);
      return fieldErrors.join(". ");
    } else if (
      err.name === "PrismaClientKnownRequestError" &&
      err.code === "P2002"
    ) {
      // handle prisma errors
      const meta = err.meta as { target?: string[] } | undefined;
      const field = meta?.target ? meta.target[0] : "field";
      if (field) {
        return `A user with this ${
          field.charAt(0).toUpperCase() + field.slice(1)
        } already exists.`;
      }
      return "A user with this email already exists.";
    } else {
      // handle other errors
      return typeof err.message === "string"
        ? err.message
        : err.message
        ? JSON.stringify(err.message)
        : "An unexpected error occurred";
    }
  }

  // If error is not an object, try to convert to string
  return String(error) || "An unexpected error occurred";
}

// round number to 2 decimal places
export function round2(value: number | string) {
  if (typeof value === "number") {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  } else if (typeof value === "string") {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  } else {
    throw new Error("Value is not a number or string");
  }
}
