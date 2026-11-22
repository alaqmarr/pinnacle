import { parseUSDToCents } from "@/lib/currency";

export interface NormalizedVariantInput {
  sku: string;
  legacySku: string | null;
  size: string;
  style: string | null;
  price: number;
  priceUnit: string | null;
  inventory: number;
  specs: string;
  sortOrder: number;
}

/**
 * Normalizes and validates an incoming array of variant payloads for product create/update APIs.
 */
export function normalizeVariantInputs(rawVariants: unknown): NormalizedVariantInput[] {
  if (!Array.isArray(rawVariants)) return [];

  const result: NormalizedVariantInput[] = [];
  rawVariants.forEach((raw, idx) => {
    if (!raw || typeof raw !== "object") return;
    const item = raw as Record<string, any>;
    const sku = String(item.sku || "").trim();
    const size = String(item.size || "").trim();
    if (!sku || !size) return;

    let priceInCents = 0;
    if (typeof item.price === "number") {
      priceInCents = Math.max(0, Math.round(item.price));
    } else if (typeof item.price === "string" && item.price.trim()) {
      priceInCents = Math.max(0, parseUSDToCents(item.price));
    }

    let specsStr = "{}";
    if (item.specs && typeof item.specs === "object" && !Array.isArray(item.specs)) {
      specsStr = JSON.stringify(item.specs);
    } else if (typeof item.specs === "string" && item.specs.trim()) {
      try {
        const parsed = JSON.parse(item.specs);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          specsStr = JSON.stringify(parsed);
        }
      } catch {
        specsStr = "{}";
      }
    }

    result.push({
      sku,
      legacySku: item.legacySku ? String(item.legacySku).trim() || null : null,
      size,
      style: item.style ? String(item.style).trim() || null : null,
      price: priceInCents,
      priceUnit: item.priceUnit ? String(item.priceUnit).trim() || null : null,
      inventory: Math.max(0, parseInt(String(item.inventory ?? 100), 10) || 0),
      specs: specsStr,
      sortOrder: typeof item.sortOrder === "number" ? item.sortOrder : idx,
    });
  });

  return result;
}
