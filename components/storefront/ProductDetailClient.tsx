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
      if (product.images.trim()) parsedImages = [product.images.trim()];
    }
  }

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const activeImage = parsedImages[activeImageIndex] || null;

  const inventory = product.inventory ?? 0;
  const isOutOfStock = inventory <= 0;
  const isLowStock = inventory > 0 && inventory <= 10;
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");

  const handleAddToCart = async () => {
    if (isOutOfStock || status !== "idle") return;

    try {
      setStatus("loading");
      await new Promise(resolve => setTimeout(resolve, 300));
      
      addToCart(
        {
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.price,
          image: activeImage,
          sku: product.sku,
        },
        quantity
      );
      
      setStatus("success");
    } catch (err) {
      setStatus("error");
    } finally {
      setTimeout(() => setStatus("idle"), 2000);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
      {/* Visual Image Gallery (Left) */}
      <div className="space-y-4">
        <div className="aspect-square w-full rounded-2xl border border-slate-200 bg-white p-8 flex items-center justify-center overflow-hidden shadow-xs relative">
          {activeImage ? (
            <img
              src={activeImage}
              alt={product.name}
              className="max-h-full max-w-full object-contain"
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
                className={`w-16 h-16 rounded-lg border p-1 bg-white overflow-hidden shrink-0 transition-all ${
                  idx === activeImageIndex
                    ? "border-sky-600 ring-2 ring-sky-200"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <img src={img} alt="" className="w-full h-full object-contain" />
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
              <Badge variant="category">{product.category.name}</Badge>
            )}
            {isOutOfStock ? (
              <Badge variant="outOfStock">Out of Stock</Badge>
            ) : isLowStock ? (
              <Badge variant="lowStock">{`Low Stock: ${inventory} remaining`}</Badge>
            ) : (
              <Badge variant="inStock">In Stock & Ready to Ship</Badge>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
            {product.name}
          </h1>

          {product.sku && (
            <p className="font-mono text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">
              SKU: {product.sku}
            </p>
          )}
        </div>

        {/* Pricing Block */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-baseline space-x-3">
            <span className="text-3xl sm:text-4xl font-black text-slate-900">
              {formatUSD(product.price)}
            </span>
            <span className="text-xs text-slate-500 font-medium">/ unit</span>
          </div>

          <p className="text-xs text-amber-700 font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Bulk Wholesale Tier: Save 10% on pallet quantities (50+ units).
          </p>
        </div>

        {/* Short Description */}
        {product.description && (
          <div className="prose prose-slate text-sm text-slate-600 leading-relaxed">
            <p>{product.description}</p>
          </div>
        )}

        {/* Quantity and Purchasing Stepper */}
        <div className="space-y-3 pt-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Order Quantity
          </label>
          <div className="flex flex-wrap items-center gap-4">
            <QuantitySelector
              quantity={quantity}
              onChange={setQuantity}
              disabled={isOutOfStock}
              max={inventory > 0 ? inventory : 9999}
              size="md"
            />

            <Button
              type="button"
              className={`w-full sm:w-auto transition-all duration-300 ${
                status === "loading" ? "bg-slate-700 text-slate-200 cursor-wait" :
                status === "success" ? "bg-emerald-600 hover:bg-emerald-700 text-white" :
                status === "error" ? "bg-red-600 hover:bg-red-700 text-white" :
                ""
              }`}
              variant={isOutOfStock ? "outline" : "primary"}
              size="lg"
              disabled={isOutOfStock || status === "loading" || status === "success"}
              onClick={handleAddToCart}
              id="add-to-cart-btn"
            >
              {isOutOfStock ? (
                "Out of Stock"
              ) : status === "loading" ? (
                "Adding..."
              ) : status === "success" ? (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  Added to Cart!
                </>
              ) : status === "error" ? (
                "Error Adding!"
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
            <span>Ships directly from Dallas Logistics Warehouse within 24 hours.</span>
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
