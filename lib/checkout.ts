/**
 * lib/checkout.ts
 *
 * Core checkout business logic and order processing utilities for Pinnacle Distributing.
 */

export const US_ZIP_REGEX = /^\d{5}(-\d{4})?$/;

/**
 * Determines whether an order should be treated as a commercial quotation request.
 * Returns true if the client explicitly submitted paymentMethod = "QUOTE" OR
 * if the global setting ecommerceMode is currently disabled (catalog mode).
 */
export function isQuoteOrder(
  paymentMethod?: string | null,
  ecommerceMode?: boolean
): boolean {
  return String(paymentMethod || "").toUpperCase() === "QUOTE" || ecommerceMode === false;
}

/**
 * Calculates whether inventory deduction should be applied to an order.
 * Strictly returns false for quote inquiries (inventory is not reserved/deducted until an order is confirmed).
 */
export function shouldDecrementInventory(isQuote: boolean): boolean {
  return !isQuote;
}

export interface InventoryUpdater {
  decrement: (productId: string, quantity: number) => Promise<any> | any;
}

/**
 * Processes inventory adjustment for order items.
 * If isQuote is true, inventory decrement is bypassed to preserve stock for quotes.
 * If isQuote is false, decrements each validated item's stock in the database.
 */
export async function processOrderInventory<T extends { productId: string; quantity: number }>(
  items: T[],
  isQuote: boolean,
  updater: InventoryUpdater
): Promise<{ decremented: boolean; processedItems: number }> {
  if (isQuote) {
    return { decremented: false, processedItems: items.length };
  }

  for (const item of items) {
    await updater.decrement(item.productId, item.quantity);
  }

  return { decremented: true, processedItems: items.length };
}
