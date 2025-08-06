import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import qs from "query-string";

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

// round number 2 decimal places
export function round2(value: number | string) {
  if (typeof value === "number") {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  } else if (typeof value === "string") {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  } else {
    throw new Error("Value must be a number");
  }
}

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  currency: "USD",
  style: "currency",
  minimumFractionDigits: 2,
});

// format currency using the formatter above
export function formatCurrency(amount: number | string | null | unknown) {
  if (typeof amount === "number") {
    return CURRENCY_FORMATTER.format(amount);
  } else if (typeof amount === "string") {
    return CURRENCY_FORMATTER.format(Number(amount));
  } else if (
    typeof amount === "object" &&
    amount !== null &&
    "toNumber" in amount &&
    typeof (amount as { toNumber: unknown }).toNumber === "function"
  ) {
    // Handle Prisma Decimal type
    return CURRENCY_FORMATTER.format(
      (amount as { toNumber: () => number }).toNumber()
    );
  } else if (amount && amount.toString) {
    // Fallback: try to convert to string then number
    return CURRENCY_FORMATTER.format(Number(amount.toString()));
  } else {
    return "NaN";
  }
}

// Format Number
const NUMBER_FORMATTER = new Intl.NumberFormat("en-US");

export function formatNumber(number: number) {
  return NUMBER_FORMATTER.format(number);
}

// Shorten UUID
export function formatId(id: string) {
  return `..${id.substring(id.length - 6)}`;
}

// Format date and times
export const formatDateTime = (dateString: Date) => {
  const dateTimeOptions: Intl.DateTimeFormatOptions = {
    month: "short", // abbreviated month name (e.g., 'Oct')
    year: "numeric", // abbreviated month name (e.g., 'Oct')
    day: "numeric", // numeric day of the month (e.g., '25')
    hour: "numeric", // numeric hour (e.g., '8')
    minute: "numeric", // numeric minute (e.g., '30')
    hour12: true, // use 12-hour clock (true) or 24-hour clock (false)
  };
  const dateOptions: Intl.DateTimeFormatOptions = {
    weekday: "short", // abbreviated weekday name (e.g., 'Mon')
    month: "short", // abbreviated month name (e.g., 'Oct')
    year: "numeric", // numeric year (e.g., '2023')
    day: "numeric", // numeric day of the month (e.g., '25')
  };
  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "numeric", // numeric hour (e.g., '8')
    minute: "numeric", // numeric minute (e.g., '30')
    hour12: true, // use 12-hour clock (true) or 24-hour clock (false)
  };
  const formattedDateTime: string = new Date(dateString).toLocaleString(
    "en-US",
    dateTimeOptions
  );
  const formattedDate: string = new Date(dateString).toLocaleString(
    "en-US",
    dateOptions
  );
  const formattedTime: string = new Date(dateString).toLocaleString(
    "en-US",
    timeOptions
  );
  return {
    dateTime: formattedDateTime,
    dateOnly: formattedDate,
    timeOnly: formattedTime,
  };
};

// form the pagination links
export function formUrlQuery({
  params,
  key,
  value,
}: {
  params: string;
  key: string;
  value: string | null;
}) {
  const query = qs.parse(params);
  query[key] = value;

  // Fix: Just stringify the query object, not an object with url property
  return qs.stringify(query, {
    skipNull: true,
  });
}
