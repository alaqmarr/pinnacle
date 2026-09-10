"use client";

import React from "react";
import Link from "next/link";
import { formatUSD } from "@/lib/currency";
import { Badge } from "@/components/ui/Badge";
import { QuickAddButton } from "@/components/storefront/QuickAddButton";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/context/CartContext";

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
  // Parse images: either JSON array string or fallback
  let displayImage = "/images/placeholder-product.svg";
  if (product.images) {
    try {
      if (product.images.startsWith("[")) {
        const parsed = JSON.parse(product.images);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]) {
          displayImage = parsed[0];
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

  const inventory = product.inventory ?? 0;
  const isOutOfStock = inventory <= 0;
  const isLowStock = inventory > 0 && inventory <= 10;

  return (
    <div className="group relative flex flex-col rounded-xl border border-slate-200 bg-white shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300 overflow-hidden">
      {/* Product Image Container */}
      <Link
        href={`/products/${product.id}`}
        className="relative aspect-4/3 w-full overflow-hidden bg-slate-50 flex items-center justify-center border-b border-slate-100"
      >
        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
          <div className="pointer-events-none">
            <span className="bg-[#C19A6B] text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider rounded-sm">
              Best Seller
            </span>
          </div>

          <button 
            type="button" 
            className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-400 hover:text-red-500 hover:scale-110 transition-all shadow-sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Future: toggle wishlist
            }}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>

        {/* Product Visual */}
        <div className="w-full h-full flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
          {displayImage.startsWith("http") || displayImage.startsWith("/") ? (
            <img
              src={displayImage}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback SVG icon on image load failure
                (e.currentTarget as HTMLElement).style.display = "none";
                const fallback = e.currentTarget.parentElement?.querySelector(".fallback-icon");
                if (fallback) (fallback as HTMLElement).style.display = "flex";
              }}
            />
          ) : null}
          <div className="fallback-icon hidden w-full h-full flex flex-col items-center justify-center text-slate-300">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span className="text-[10px] text-slate-400 mt-1 uppercase font-mono">Pinnacle Item</span>
          </div>
        </div>
      </Link>

      {/* Product Content */}
      <div className="flex flex-1 flex-col p-4 justify-between">
        <div>
          {product.sku && (
            <p className="font-mono text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              SKU: {product.sku}
            </p>
          )}

          <Link href={`/products/${product.id}`}>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 line-clamp-2 hover:text-sky-600 transition-colors">
              {product.name}
            </h3>
          </Link>
        </div>

        <div className="mt-2 mb-4">
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg key={star} className="w-3.5 h-3.5 text-[#F5B53B]" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="text-xs text-slate-500 ml-1 font-medium">(27)</span>
          </div>

          <span className="text-xl sm:text-2xl font-black text-[#0B1E36] tracking-tight">
            {formatUSD(product.price)}
          </span>
        </div>

        <QuickAddButton product={product} />
      </div>
    </div>
  );
}
