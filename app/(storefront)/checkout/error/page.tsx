import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Checkout Failed | Pinnacle Distributing",
  description: "Checkout error recovery and order retry assistance.",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

interface ErrorPageProps {
  searchParams: Promise<{ reason?: string; message?: string }>;
}

export default async function CheckoutErrorPage({ searchParams }: ErrorPageProps) {
  const resolved = await searchParams;
  const reason = resolved.reason || "PAYMENT_DECLINED";
  const message =
    resolved.message ||
    "Your transaction could not be completed. Your cart items have been safely preserved.";

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-xl mx-auto w-full">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 shadow-xs text-center space-y-6">
        {/* Red Alert Icon */}
        <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto shadow-xs">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-red-600 block mb-1">
            Transaction Incomplete
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Checkout Failed
          </h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            {message}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-500 text-left space-y-1">
          <div className="flex justify-between">
            <span>Error Code / Reason:</span>
            <strong className="text-red-600 font-bold">{reason}</strong>
          </div>
          <div className="flex justify-between">
            <span>Preservation Status:</span>
            <span className="text-emerald-600 font-semibold">Cart Preserved</span>
          </div>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
          <Link href="/cart">
            <Button variant="primary" size="lg">
              Return to Cart
            </Button>
          </Link>
          <Link href="/checkout">
            <Button variant="outline" size="lg">
              Retry Checkout
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
