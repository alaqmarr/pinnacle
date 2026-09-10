import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { CartPageClient } from "@/components/storefront/CartPageClient";

export const metadata: Metadata = {
  title: "Shopping Cart | Pinnacle Distributing",
  description:
    "Review items in your Pinnacle Distributing shopping cart. Update quantities, calculate freight dispatch, and proceed to checkout.",
  openGraph: {
    title: "Shopping Cart | Pinnacle Distributing",
    description: "Review your commercial packaging and janitorial supplies cart.",
  },
};

export default function CartPage() {
  return (
    <div id="cart-container" className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-slate-900 transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="font-semibold text-slate-900">Shopping Cart</span>
      </nav>

      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Commercial Shopping Cart
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your items, check freight thresholds, and review volume pricing.
        </p>
      </div>

      <CartPageClient />
    </div>
  );
}
