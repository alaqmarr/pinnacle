"use client";

import React, { useState } from "react";
import Link from "next/link";
import { formatUSD } from "@/lib/currency";
import { QuickAddButton } from "@/components/storefront/QuickAddButton";
import { useSettings } from "@/context/SettingsContext";

export interface ProductCardProps {
  product: {
    id: string;
    name: string;
    slug: string;
    price: number; // in cents
    sku?: string | null;
    inventory?: number;
    images?: string;
    featured?: boolean;
    category?: {
      id: string;
      name: string;
      slug: string;
    } | null;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const { ecommerceMode } = useSettings();
  const [imgError, setImgError] = useState(false);

  let displayImage = "";
  if (product.images) {
    try {
      if (product.images.startsWith("[")) {
        const parsed = JSON.parse(product.images);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]) {
          displayImage = String(parsed[0]).trim();
        }
      } else if (product.images.trim().length > 0) {
        displayImage = product.images.trim();
      }
    } catch {
      if (product.images.trim().length > 0) {
        displayImage = product.images.trim();
      }
    }
  }

  const hasValidImage =
    !imgError &&
    Boolean(displayImage) &&
    (displayImage.startsWith("http") || displayImage.startsWith("/"));

  const inventory = typeof product.inventory === "number" ? product.inventory : undefined;
  const isOutOfStock = inventory !== undefined && inventory <= 0;
  const isLowStock = inventory !== undefined && inventory > 0 && inventory <= 10;
  const productHref = `/products/${product.slug || product.id}`;

  return (
    <div className="group relative flex flex-col rounded-xl border border-slate-200 bg-white shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300 overflow-hidden">
      {/* Product Image Container */}
      <Link
        href={productHref}
        className="relative aspect-square w-full overflow-hidden bg-slate-50 flex items-center justify-center border-b border-slate-100"
      >
        {/* Real Data Badges Only (Featured / Stock Status) */}
        {(product.featured || isOutOfStock || isLowStock) && (
          <div className="absolute top-3 left-3 right-3 flex flex-wrap items-center gap-1.5 z-10 pointer-events-none">
            {product.featured && (
              <span className="bg-[#0F4288] text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider rounded shadow-xs">
                Featured
              </span>
            )}
            {isOutOfStock ? (
              <span className="bg-amber-600 text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider rounded shadow-xs">
                Backorder
              </span>
            ) : isLowStock ? (
              <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider rounded">
                Low Stock ({inventory})
              </span>
            ) : null}
          </div>
        )}

        {/* Product Visual */}
        <div className="w-full h-full flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
          {hasValidImage ? (
            <img
              src={displayImage}
              alt={product.name}
              className="w-full h-full object-cover block"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 p-6">
              <svg
                className="w-12 h-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.25}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              <span className="text-[10px] text-slate-400 mt-1.5 uppercase font-mono tracking-wider">
                {product.category?.name || "Catalog Supply"}
              </span>
            </div>
          )}
        </div>
      </Link>

      {/* Product Content */}
      <div className="flex flex-1 flex-col p-4 justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            {product.sku ? (
              <p className="font-mono text-[11px] font-semibold text-slate-400 uppercase tracking-wider truncate">
                SKU: {product.sku}
              </p>
            ) : (
              <span />
            )}
            {inventory !== undefined && inventory > 10 && (
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">
                In Stock
              </span>
            )}
          </div>

          <Link href={productHref}>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 line-clamp-2 hover:text-sky-600 transition-colors">
              {product.name}
            </h3>
          </Link>

          {product.category?.name && (
            <p className="text-xs text-slate-500 mt-1 truncate">
              {product.category.name}
            </p>
          )}
        </div>

        <div className="mt-3 mb-4 pt-2 border-t border-slate-100">
          {ecommerceMode ? (
            <span className="text-xl sm:text-2xl font-black text-[#0B1E36] tracking-tight">
              {formatUSD(product.price)}
            </span>
          ) : (
            <span className="inline-block text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-1 rounded">
              Quote on Request
            </span>
          )}
        </div>

        <QuickAddButton
          product={{
            ...product,
            image: hasValidImage ? displayImage : undefined,
          }}
        />
      </div>
    </div>
  );
}
