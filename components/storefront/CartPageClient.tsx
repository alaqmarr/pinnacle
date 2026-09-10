"use client";

import React from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { formatUSD } from "@/lib/currency";
import { QuantitySelector } from "@/components/ui/QuantitySelector";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/storefront/EmptyState";

export function CartPageClient() {
  const {
    items,
    totalItems,
    subtotal,
    isHydrated,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  if (!isHydrated) {
    return (
      <div className="py-20 text-center text-slate-400">
        <div className="w-8 h-8 border-2 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs font-mono">Restoring Cart Session...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="py-12">
        <EmptyState
          icon="cart"
          title="Your Shopping Cart is Empty"
          description="You have not added any industrial packaging or cleaning supplies to your cart yet. Explore our catalog for corrugated cartons, pallet film, and disinfectants."
          actionText="Browse Commercial Catalog"
          actionHref="/products"
          secondaryActionText="View Product Categories"
          secondaryActionHref="/categories"
        />
      </div>
    );
  }

  const estimatedShipping = 1495; // Standard: $14.95
  const estimatedTax = Math.round(subtotal * 0.0825);
  const estimatedTotal = subtotal + estimatedShipping + estimatedTax;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
      {/* Left Column: Items Table */}
      <div className="lg:col-span-8 space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">
              Cart Items ({totalItems})
            </h2>
            <button
              type="button"
              onClick={clearCart}
              className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors"
            >
              Clear Entire Cart
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {items.map((item) => (
              <div key={item.productId} className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-4 min-w-0">
                  <div className="w-16 h-16 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 p-0 m-0 overflow-hidden">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover block m-0 p-0"
                      />
                    ) : (
                      <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    )}
                  </div>

                  <div className="min-w-0">
                    <Link
                      href={`/products/${item.productId}`}
                      className="text-sm font-bold text-slate-900 hover:text-sky-600 line-clamp-1 block transition-colors"
                    >
                      {item.name}
                    </Link>
                    {item.sku && (
                      <p className="text-[11px] font-mono text-slate-400 uppercase mt-0.5">
                        SKU: {item.sku}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                      {formatUSD(item.price)} each
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto space-x-6">
                  <QuantitySelector
                    quantity={item.quantity}
                    onChange={(q) => updateQuantity(item.productId, q)}
                    size="sm"
                  />

                  <div className="text-right min-w-[80px]">
                    <span className="text-base font-extrabold text-slate-900 block">
                      {formatUSD(item.price * item.quantity)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.productId)}
                      className="text-[11px] text-red-500 hover:text-red-700 font-medium transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center px-2">
          <Link
            href="/products"
            className="text-xs font-bold text-sky-600 hover:text-sky-700 inline-flex items-center"
          >
            ← Continue Shopping
          </Link>
        </div>
      </div>

      {/* Right Column: Order Summary */}
      <div className="lg:col-span-4">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
            Order Summary
          </h2>

          <div className="space-y-3 text-xs sm:text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Items Subtotal</span>
              <span className="font-semibold text-slate-900">{formatUSD(subtotal)}</span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>Estimated Freight Shipping</span>
              <span className="font-semibold text-slate-900">{formatUSD(estimatedShipping)}</span>
            </div>

            <div className="flex justify-between text-slate-600">
              <span>Estimated Tax (8.25%)</span>
              <span className="font-semibold text-slate-900">{formatUSD(estimatedTax)}</span>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-between text-base font-extrabold text-slate-900">
              <span>Estimated Total</span>
              <span className="text-xl text-slate-900">{formatUSD(estimatedTotal)}</span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Link href="/checkout" className="block w-full">
              <Button variant="accent" size="lg" fullWidth>
                Proceed to Checkout
              </Button>
            </Link>

            <p className="text-[11px] text-slate-400 text-center leading-relaxed">
              Wholesale pricing in strict USD ($). Secure checkout with address verification and instant confirmation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
