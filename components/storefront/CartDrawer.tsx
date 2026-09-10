"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { formatUSD } from "@/lib/currency";
import { QuantitySelector } from "@/components/ui/QuantitySelector";
import { Button } from "@/components/ui/Button";

export function CartDrawer({ session }: { session?: any }) {
  const {
    items,
    totalItems,
    subtotal,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
  } = useCart();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isCartOpen) {
        closeCart();
      }
    };
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCartOpen, closeCart]);

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={closeCart}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-slate-200">
          {/* Header */}
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center space-x-2">
              <svg
                className="w-5 h-5 text-amber-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              <h2 className="text-base font-bold tracking-wide">
                Your Shopping Cart ({totalItems})
              </h2>
            </div>
            <button
              type="button"
              onClick={closeCart}
              className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Close cart drawer"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Guest Persistent Notice */}
          {!session ? (
            <div className="bg-amber-50 px-6 py-2.5 border-b border-amber-200 text-xs text-amber-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Shopping as Guest (Cart preserved)
              </span>
              <Link
                href="/login"
                onClick={closeCart}
                className="font-bold underline hover:text-amber-900 ml-2 shrink-0"
              >
                Sign In
              </Link>
            </div>
          ) : (
            <div className="bg-sky-50 px-6 py-2.5 border-b border-sky-200 text-xs text-sky-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-sky-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Signed in as {session.user?.name || "Customer"}
              </span>
              <Link
                href={session.user?.role === "ADMIN" || session.user?.role === "MARKETING" ? "/admin" : "/account"}
                onClick={closeCart}
                className="font-bold underline hover:text-sky-900 ml-2 shrink-0"
              >
                Account
              </Link>
            </div>
          )}

          {/* Cart Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1">Your cart is empty</h3>
                <p className="text-xs text-slate-500 mb-6 max-w-xs">
                  Browse our heavy-duty packaging cartons, stretch wrap, and industrial cleaning supplies.
                </p>
                <Link href="/products" onClick={closeCart}>
                  <Button variant="primary" size="sm">
                    Browse Catalog
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {items.map((item) => (
                  <div key={item.productId} className="py-4 flex gap-4 items-start">
                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-lg bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 p-1">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <svg className="w-6 h-6 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/products/${item.productId}`}
                        onClick={closeCart}
                        className="text-sm font-semibold text-slate-900 hover:text-sky-600 line-clamp-1 block"
                      >
                        {item.name}
                      </Link>
                      {item.sku && (
                        <p className="text-[10px] font-mono text-slate-400 uppercase mt-0.5">
                          SKU: {item.sku}
                        </p>
                      )}
                      <p className="text-xs text-slate-600 mt-1 font-medium">
                        {formatUSD(item.price)} each
                      </p>

                      <div className="mt-3 flex items-center justify-between">
                        <QuantitySelector
                          quantity={item.quantity}
                          onChange={(q) => updateQuantity(item.productId, q)}
                          size="sm"
                        />

                        <div className="text-right">
                          <span className="text-sm font-bold text-slate-900 block">
                            {formatUSD(item.price * item.quantity)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.productId)}
                            className="text-[11px] text-red-500 hover:text-red-700 font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-slate-200 bg-slate-50 p-6 space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-base font-bold text-slate-900">
                  <span>Subtotal</span>
                  <span className="text-xl font-extrabold text-slate-900">
                    {formatUSD(subtotal)}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Shipping, freight, and tax calculated at checkout.
                </p>
              </div>

              <div className="space-y-2">
                <Link href="/checkout" onClick={closeCart} className="block w-full">
                  <Button variant="accent" size="lg" fullWidth>
                    Proceed to Checkout
                  </Button>
                </Link>

                <Link href="/cart" onClick={closeCart} className="block w-full">
                  <Button variant="outline" size="md" fullWidth>
                    View Full Cart Page
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
