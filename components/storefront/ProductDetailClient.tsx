"use client";

import React, { useState } from "react";
import { formatUSD } from "@/lib/currency";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { QuantitySelector } from "@/components/ui/QuantitySelector";
import { useCart } from "@/context/CartContext";
import { useSettings } from "@/context/SettingsContext";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

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
  const { ecommerceMode, whatsappNumber } = useSettings();
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

          {ecommerceMode ? (
            <div className="mt-4 flex items-baseline gap-4">
              <span className="text-3xl sm:text-4xl font-black text-slate-900">
                {formatUSD(product.price)}
              </span>
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                / Unit &bull; Industrial Wholesale
              </span>
            </div>
          ) : (
            <div className="mt-4">
              <span className="inline-block text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-3 py-1.5 rounded">
                Catalog Item &bull; Quote Required
              </span>
            </div>
          )}
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
          {ecommerceMode ? (
            <>
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
            </>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Quantity for Quote
                </label>
                <QuantitySelector
                  quantity={quantity}
                  onChange={setQuantity}
                  min={1}
                  max={product.inventory && product.inventory > 0 ? product.inventory : 999}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <Button
                  size="lg"
                  className="w-full font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-sm flex items-center justify-center gap-2"
                  onClick={handleAddToCart}
                >
                  {isAdded ? (
                    <>
                      <svg className="w-5 h-5 mr-1 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Added to Quote!
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      Add to Cart (Build Quote)
                    </>
                  )}
                </Button>

                <a
                  href={buildWhatsAppUrl(
                    whatsappNumber,
                    product.name,
                    product.sku,
                    typeof window !== "undefined" ? window.location.href : undefined,
                    quantity
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-bold text-white bg-[#25D366] hover:bg-[#1ebe5d] transition-all shadow-sm text-sm sm:text-base cursor-pointer"
                >
                  <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.301-.15-1.78-.879-2.056-.98-.276-.1-.477-.15-.678.15-.201.3-.778.98-.954 1.18-.176.2-.352.226-.653.076-.301-.15-1.272-.469-2.423-1.496-.897-.798-1.503-1.785-1.68-2.086-.176-.301-.019-.464.132-.614.136-.135.301-.351.452-.527.15-.176.2-.301.301-.502.1-.201.05-.377-.025-.527-.075-.15-.678-1.633-.929-2.235-.244-.587-.492-.507-.678-.517-.176-.01-.377-.01-.578-.01-.201 0-.527.076-.803.376s-1.054 1.029-1.054 2.509c0 1.48 1.079 2.909 1.23 3.11 0.15.201 2.123 3.242 5.143 4.545.719.31 1.28.496 1.718.636.723.23 1.381.197 1.901.12.579-.087 1.78-.728 2.031-1.431.251-.703.251-1.305.176-1.431-.075-.126-.276-.201-.577-.351zM12.042 21.75c-1.748 0-3.46-.464-4.97-1.344l-.356-.211-3.696.97.986-3.603-.232-.37c-.968-1.542-1.48-3.329-1.48-5.167 0-5.385 4.381-9.766 9.768-9.766 2.609 0 5.061 1.017 6.906 2.862s2.862 4.298 2.862 6.908c0 5.385-4.381 9.765-9.768 9.765zm8.334-18.102C18.172 1.444 15.228.333 12.042.333 5.617.333.385 5.566.385 11.99c0 2.053.536 4.057 1.554 5.823L0 24l6.353-1.666c1.706.93 3.633 1.419 5.689 1.419 6.425 0 11.658-5.233 11.658-11.658 0-3.116-1.213-6.046-3.324-8.197z"/>
                  </svg>
                  <span>Enquire on WhatsApp</span>
                </a>
              </div>
            </div>
          )}
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
