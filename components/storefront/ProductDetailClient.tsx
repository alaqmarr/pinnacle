"use client";

import React, { useState } from "react";
import { formatUSD } from "@/lib/currency";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { QuantitySelector } from "@/components/ui/QuantitySelector";
import { useCart } from "@/context/CartContext";

export interface ProductDetailClientProps {
  product: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    price: number; // in cents
    sku?: string | null;
    inventory?: number;
    images?: string;
    category?: {
      id: string;
      name: string;
      slug: string;
    } | null;
    originDispatch?: string | null;
  };
}

export function ProductDetailClient({ product }: ProductDetailClientProps) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);

  // Parse images array
  let parsedImages: string[] = [];
  if (product.images) {
    try {
      if (product.images.startsWith("[")) {
        const p = JSON.parse(product.images);
        if (Array.isArray(p)) parsedImages = p.filter(Boolean);
      } else if (product.images.trim()) {
        parsedImages = [product.images.trim()];
      }
    } catch {
      parsedImages = product.images ? [product.images] : [];
    }
  }

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const activeImage = parsedImages[activeImageIndex] || parsedImages[0] || "";

  const handleAddToCart = () => {
    addToCart(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        image: activeImage,
        slug: product.slug,
        sku: product.sku,
      },
      quantity
    );
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        image: activeImage,
        slug: product.slug,
        sku: product.sku,
      },
      quantity
    );
    if (typeof window !== "undefined") {
      window.location.href = "/cart";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
      {/* Visual Image Gallery (Left) */}
      <div className="space-y-4">
        <div className="aspect-square w-full rounded-2xl border border-slate-200 bg-white p-0 m-0 flex items-center justify-center overflow-hidden shadow-xs relative">
          {activeImage ? (
            <img
              src={activeImage}
              alt={product.name}
              className="w-full h-full object-cover block m-0 p-0"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-300">
              <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 mt-2">
                Pinnacle Item
              </span>
            </div>
          )}
        </div>

        {/* Thumbnails strip */}
        {parsedImages.length > 1 && (
          <div className="flex items-center space-x-3 overflow-x-auto pb-2">
            {parsedImages.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImageIndex(idx)}
                className={`w-16 h-16 rounded-lg border p-0 m-0 bg-white overflow-hidden shrink-0 transition-all ${
                  idx === activeImageIndex
                    ? "border-sky-600 ring-2 ring-sky-200"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-cover block m-0 p-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Purchasing & Product Information (Right) */}
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            {product.category && (
              <Badge variant="category" className="text-xs text-sky-800 bg-sky-50/50 border-sky-200">
                {product.category.name}
              </Badge>
            )}
            {product.sku && (
              <span className="text-xs font-mono text-slate-400 tracking-wider">
                SKU: {product.sku}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {product.name}
          </h1>

          <div className="mt-4 flex items-baseline gap-4">
            <span className="text-3xl sm:text-4xl font-black text-slate-900">
              {formatUSD(product.price)}
            </span>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              / Unit • Industrial Wholesale
            </span>
          </div>
        </div>

        {/* Stock status */}
        <div className="flex items-center gap-2">
          {product.inventory && product.inventory > 0 ? (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">
                In Stock ({product.inventory} Available for Dispatch)
              </span>
            </>
          ) : (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">
                Backorder Available (Ships in 3-5 days)
              </span>
            </>
          )}
        </div>

        {/* Description */}
        {product.description && (
          <div className="border-t border-slate-100 pt-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Item Overview & Specs
            </h2>
            <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {product.description}
            </div>
          </div>
        )}

        {/* Purchasing Controls */}
        <div className="border-t border-slate-200 pt-6 space-y-4">
          <div className="flex items-center gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Quantity
              </label>
              <QuantitySelector
                quantity={quantity}
                onChange={setQuantity}
                min={1}
                max={product.inventory && product.inventory > 0 ? product.inventory : 999}
              />
            </div>

            <div className="flex-1 pt-6">
              <Button
                size="lg"
                variant="outline"
                className="w-full text-slate-700 border-slate-300 hover:bg-slate-50 font-bold"
                onClick={handleBuyNow}
              >
                Instant Buy
              </Button>
            </div>
          </div>

          <div>
            <Button
              size="lg"
              className="w-full font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-sm"
              onClick={handleAddToCart}
            >
              {isAdded ? (
                <>
                  <svg className="w-5 h-5 mr-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Added to Cart!
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  Add to Cart
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Operational Guarantees */}
        <div className="border-t border-slate-200 pt-6 space-y-3 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Ships directly from {product.originDispatch || "Dallas Logistics Warehouse"} within 24 hours.</span>
          </div>
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Safety Data Sheets (SDS) and technical compliance certificates available upon request.</span>
          </div>
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Commercial B2B Net 30 purchase order terms supported.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
