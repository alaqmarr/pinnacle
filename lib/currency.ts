/**
 * lib/currency.ts
 * 
 * Strict USD currency formatting and parsing utilities for Pinnacle Distributing.
 * Ensures zero floating-point inaccuracies by storing all monetary amounts as integer cents.
 */

// Module-level cached formatter instance for optimal rendering performance across catalogs
const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Formats an integer cents amount into a strict USD currency string.
 * Example: 1999 -> ".99", 0 -> ".00", -500 -> "-.00"
 * 
 * @param cents - Integer cents. If null, undefined, or NaN, returns ".00".
 * @returns Formatted USD currency string.
 */
export function formatUSD(cents: number | null | undefined): string {
  if (cents === null || cents === undefined || isNaN(cents) || !isFinite(cents)) {
    return usdFormatter.format(0);
  }
  // Round to nearest integer cent first to guard against unintended floating-point values
  const roundedCents = Math.round(cents);
  const dollars = roundedCents / 100;
  return usdFormatter.format(dollars);
}

/**
 * Parses user input (string or number) into integer cents.
 * Handles diverse formats: ".99", "19.99", ",249.99", " .50 ", "-.25", 19.99.
 * 
 * @param val - String or number to parse.
 * @returns Integer cents (e.g., 1999). Returns 0 on invalid or empty input.
 */
export function parseUSDToCents(val: string | number | null | undefined): number {
  if (val === null || val === undefined) {
    return 0;
  }

  if (typeof val === "number") {
    if (isNaN(val) || !isFinite(val)) {
      return 0;
    }
    // Round to eliminate IEEE-754 precision artifacts (e.g. 19.99 * 100 = 1998.9999999999998)
    return Math.round(val * 100);
  }

  const str = String(val).trim();
  if (!str) {
    return 0;
  }

  // Detect negative values
  const isNegative = str.includes("-");

  // Keep only digits and decimal point
  const cleaned = str.replace(/[^0-9.]/g, "");
  if (!cleaned) {
    return 0;
  }

  const parsed = parseFloat(cleaned);
  if (isNaN(parsed) || !isFinite(parsed)) {
    return 0;
  }

  const cents = Math.round(parsed * 100);
  return isNegative ? -cents : cents;
}

/**
 * Formats integer cents into a standard 2-decimal dollar string for HTML form input fields (e.g., 1999 -> "19.99").
 * 
 * @param cents - Integer cents.
 * @returns 2-decimal string representation.
 */
export function centsToDollarString(cents: number | null | undefined): string {
  if (cents === null || cents === undefined || isNaN(cents) || !isFinite(cents)) {
    return "0.00";
  }
  const dollars = Math.round(cents) / 100;
  return dollars.toFixed(2);
}

/**
 * Converts integer cents to a standard decimal dollar number (e.g., 1999 -> 19.99).
 * 
 * @param cents - Integer cents.
 * @returns Decimal dollars.
 */
export function centsToDollars(cents: number | null | undefined): number {
  if (cents === null || cents === undefined || isNaN(cents) || !isFinite(cents)) {
    return 0;
  }
  return Math.round(cents) / 100;
}

/**
 * Converts decimal dollars to integer cents (e.g., 19.99 -> 1999).
 * 
 * @param dollars - Decimal dollars.
 * @returns Integer cents.
 */
export function dollarsToCents(dollars: number | null | undefined): number {
  if (dollars === null || dollars === undefined || isNaN(dollars) || !isFinite(dollars)) {
    return 0;
  }
  return Math.round(dollars * 100);
}
