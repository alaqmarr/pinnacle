"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { formatUSD } from "@/lib/currency";
import { useCart } from "@/context/CartContext";
import { useSettings } from "@/context/SettingsContext";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

export interface ProductVariantDTO {
  id: string;
  sku: string;
  legacySku?: string | null;
  size: string;
  style?: string | null;
  price: number;
  priceUnit?: string | null;
  inventory: number;
  specs?: string | null;
}

interface ProductVariantsTableProps {
  product: {
    id: string;
    name: string;
    slug: string;
    image?: string;
  };
  variants: ProductVariantDTO[];
  selectedVariantId?: string | null;
  onSelectVariant?: (variant: ProductVariantDTO) => void;
}

function parseSpecs(raw?: string | null): Record<string, string> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const clean: Record<string, string> = {};
      for (const [k, v] of Object.entries(parsed)) {
        if (v !== undefined && v !== null && String(v).trim() !== "") {
          clean[k] = String(v).trim();
        }
      }
      return clean;
    }
  } catch {
    // ignore malformed specs
  }
  return {};
}

export function ProductVariantsTable({
  product,
  variants,
  selectedVariantId,
  onSelectVariant,
}: ProductVariantsTableProps) {
  const { addToCart } = useCart();
  const { ecommerceMode, whatsappNumber } = useSettings();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeStyle, setActiveStyle] = useState<string>("ALL");
  const [rowQtys, setRowQtys] = useState<Record<string, number>>({});
  const [addedRowId, setAddedRowId] = useState<string | null>(null);

  const parsedVariants = useMemo(() => {
    return variants.map((v) => ({
      ...v,
      parsedSpecs: parseSpecs(v.specs),
    }));
  }, [variants]);

  const hasLegacySku = useMemo(
    () => parsedVariants.some((v) => Boolean(v.legacySku && v.legacySku.trim())),
    [parsedVariants]
  );

  const distinctStyles = useMemo(() => {
    const styles: string[] = [];
    for (const v of parsedVariants) {
      if (v.style && !styles.includes(v.style)) {
        styles.push(v.style);
      }
    }
    return styles;
  }, [parsedVariants]);

  const hasStyle = distinctStyles.length > 0;

  const specColumns = useMemo(() => {
    const cols: string[] = [];
    for (const v of parsedVariants) {
      for (const key of Object.keys(v.parsedSpecs)) {
        if (!cols.includes(key)) {
          cols.push(key);
        }
      }
    }
    return cols;
  }, [parsedVariants]);

  const primaryPriceUnit = useMemo(() => {
    const units = Array.from(new Set(parsedVariants.map((v) => v.priceUnit).filter(Boolean)));
    return units.length === 1 ? units[0]! : "Price";
  }, [parsedVariants]);

  const filteredVariants = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return parsedVariants.filter((v) => {
      if (activeStyle !== "ALL" && v.style !== activeStyle) return false;
      if (!q) return true;
      const haystack = [
        v.sku,
        v.legacySku || "",
        v.size,
        v.style || "",
        ...Object.values(v.parsedSpecs),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [parsedVariants, activeStyle, searchTerm]);

  if (!variants || variants.length === 0) {
    return null;
  }

  const handleRowAdd = (e: React.MouseEvent, variant: ProductVariantDTO) => {
    e.stopPropagation();
    const qty = Math.max(1, rowQtys[variant.id] || 1);
    addToCart(
      {
        id: product.id,
        variantId: variant.id,
        variantLabel: variant.size,
        name: product.name,
        slug: product.slug,
        price: variant.price,
        image: product.image || undefined,
        sku: variant.sku,
      },
      qty
    );
    if (onSelectVariant) {
      onSelectVariant(variant);
    }
    setAddedRowId(variant.id);
    setTimeout(() => {
      setAddedRowId((prev) => (prev === variant.id ? null : prev));
    }, 1800);
  };

  return (
    <div
      id="variants-table"
      className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden"
    >
      {/* Header & Controls */}
      <div className="p-6 border-b border-slate-200 bg-slate-50/60 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider">
                Available Sizes &amp; Variants
              </h2>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                {variants.length} {variants.length === 1 ? "Option" : "Options"}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Click any row to inspect or add the exact stock code and size directly to your{" "}
              {ecommerceMode ? "cart" : "quote"}.
            </p>
          </div>

          {variants.length > 5 && (
            <div className="relative w-full sm:w-72">
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter by size, SKU, or spec..."
                className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <svg
                className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Style / Grade Filter Pills */}
        {distinctStyles.length >= 2 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1">
              Filter Type:
            </span>
            <button
              type="button"
              onClick={() => setActiveStyle("ALL")}
              className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-colors ${
                activeStyle === "ALL"
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              All ({variants.length})
            </button>
            {distinctStyles.map((st) => {
              const count = parsedVariants.filter((v) => v.style === st).length;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setActiveStyle(st)}
                  className={`text-xs px-2.5 py-1 rounded-md font-semibold transition-colors ${
                    activeStyle === st
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {st} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Responsive Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-900 text-white uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4 font-bold whitespace-nowrap">Stock Code</th>
              {hasLegacySku && (
                <th className="py-3 px-4 font-bold whitespace-nowrap">Legacy Code</th>
              )}
              {hasStyle && (
                <th className="py-3 px-4 font-bold whitespace-nowrap">Style / Grade</th>
              )}
              <th className="py-3 px-4 font-bold whitespace-nowrap">Size / Description</th>
              {specColumns.map((col) => (
                <th key={col} className="py-3 px-4 font-bold whitespace-nowrap">
                  {col}
                </th>
              ))}
              {ecommerceMode && (
                <th className="py-3 px-4 font-bold whitespace-nowrap text-right">
                  {primaryPriceUnit}
                </th>
              )}
              <th className="py-3 px-4 font-bold whitespace-nowrap text-right">
                {ecommerceMode ? "Order" : "Quote"}
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {filteredVariants.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    3 +
                    (hasLegacySku ? 1 : 0) +
                    (hasStyle ? 1 : 0) +
                    specColumns.length +
                    (ecommerceMode ? 1 : 0)
                  }
                  className="py-8 text-center text-slate-500"
                >
                  No matching variants found. Try clearing your filter.
                </td>
              </tr>
            ) : (
              filteredVariants.map((variant, idx) => {
                const isSelected = variant.id === selectedVariantId;
                const isQuoteOnly = !ecommerceMode || variant.price <= 0;
                const isJustAdded = addedRowId === variant.id;
                const qty = rowQtys[variant.id] || 1;

                return (
                  <tr
                    key={variant.id}
                    onClick={() => onSelectVariant && onSelectVariant(variant)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-sky-50/90 hover:bg-sky-50"
                        : idx % 2 === 0
                        ? "bg-white hover:bg-slate-50"
                        : "bg-slate-50/40 hover:bg-slate-100/60"
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {isSelected && (
                          <span
                            className="w-2 h-2 rounded-full bg-sky-600 shrink-0"
                            title="Selected Variant"
                          />
                        )}
                        <span>{variant.sku}</span>
                      </div>
                    </td>

                    {hasLegacySku && (
                      <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                        {variant.legacySku || "—"}
                      </td>
                    )}

                    {hasStyle && (
                      <td className="py-3 px-4 text-slate-700 font-medium whitespace-nowrap">
                        {variant.style || "—"}
                      </td>
                    )}

                    <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {variant.size}
                    </td>

                    {specColumns.map((col) => (
                      <td
                        key={col}
                        className="py-3 px-4 text-slate-600 whitespace-nowrap font-mono text-[11px]"
                      >
                        {variant.parsedSpecs[col] || "—"}
                      </td>
                    ))}

                    {ecommerceMode && (
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {variant.price > 0 ? (
                          <div>
                            <span className="font-extrabold text-slate-900 font-mono text-sm">
                              {formatUSD(variant.price)}
                            </span>
                            {variant.priceUnit &&
                              primaryPriceUnit === "Price" && (
                                <span className="block text-[10px] text-slate-400">
                                  {variant.priceUnit}
                                </span>
                              )}
                          </div>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold uppercase">
                            Call for Quote
                          </span>
                        )}
                      </td>
                    )}

                    <td
                      className="py-3 px-4 text-right whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {ecommerceMode && variant.price > 0 ? (
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <input
                            type="number"
                            min={1}
                            max={9999}
                            value={qty}
                            onChange={(e) =>
                              setRowQtys((prev) => ({
                                ...prev,
                                [variant.id]: Math.max(1, parseInt(e.target.value, 10) || 1),
                              }))
                            }
                            aria-label={`Quantity for ${variant.sku}`}
                            className="w-14 px-2 py-1 text-center text-xs font-mono border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                          />
                          <button
                            type="button"
                            onClick={(e) => handleRowAdd(e, variant)}
                            className={`px-3 py-1.5 rounded font-bold text-xs transition-colors ${
                              isJustAdded
                                ? "bg-emerald-600 text-white"
                                : "bg-sky-600 hover:bg-sky-700 text-white"
                            }`}
                          >
                            {isJustAdded ? "Added ✓" : "+ Add"}
                          </button>
                        </div>
                      ) : !ecommerceMode ? (
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => handleRowAdd(e, variant)}
                            className={`px-3 py-1.5 rounded font-bold text-xs transition-colors ${
                              isJustAdded
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-800 hover:bg-slate-900 text-white"
                            }`}
                          >
                            {isJustAdded ? "Added ✓" : "+ Quote"}
                          </button>
                          <a
                            href={buildWhatsAppUrl(
                              whatsappNumber,
                              `${product.name} (${variant.size})`,
                              variant.sku,
                              typeof window !== "undefined" ? window.location.href : undefined,
                              qty
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 rounded font-bold text-xs bg-[#25D366] hover:bg-[#1ebe5d] text-white"
                          >
                            WhatsApp
                          </a>
                        </div>
                      ) : (
                        <Link
                          href={`/contact?subject=${encodeURIComponent(
                            `Quote Inquiry: ${product.name} (${variant.sku} - ${variant.size})`
                          )}`}
                          className="inline-block px-3 py-1.5 rounded font-bold text-xs bg-amber-600 hover:bg-amber-700 text-white transition-colors"
                        >
                          Request Quote
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
