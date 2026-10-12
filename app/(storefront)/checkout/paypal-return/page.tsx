"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import Link from "next/link";

function PayPalReturnContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart } = useCart();

  const token = searchParams.get("token"); // PayPal Order ID
  const payerId = searchParams.get("PayerID");

  const [status, setStatus] = useState<"processing" | "error">("processing");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("Missing PayPal authorization token.");
      return;
    }

    let isMounted = true;

    async function captureOrder() {
      try {
        let pendingCheckout: any = null;
        try {
          const raw =
            sessionStorage.getItem("pinnacle_pending_checkout") ||
            localStorage.getItem("pinnacle_pending_checkout");
          if (raw) {
            pendingCheckout = JSON.parse(raw);
          }
        } catch {
          // ignore
        }

        const res = await fetch("/api/storefront/paypal/capture-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderID: token,
            customer: pendingCheckout?.customer,
            shippingAddress: pendingCheckout?.shippingAddress,
            shippingMethod: pendingCheckout?.shippingMethod,
            items: pendingCheckout?.items,
            notes: pendingCheckout?.notes,
          }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          try {
            sessionStorage.removeItem("pinnacle_pending_checkout");
            localStorage.removeItem("pinnacle_pending_checkout");
          } catch {
            // ignore
          }
          clearCart();
          router.replace(`/checkout/success?orderId=${data.orderId}`);
        } else {
          if (isMounted) {
            setStatus("error");
            setErrorMessage(data.error || "Failed to finalize PayPal payment.");
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setStatus("error");
          setErrorMessage(err.message || "Network error while completing your transaction.");
        }
      }
    }

    captureOrder();

    return () => {
      isMounted = false;
    };
  }, [token, router, clearCart]);

  if (status === "error") {
    return (
      <div className="py-16 px-4 max-w-xl mx-auto text-center space-y-6">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
          ✕
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Payment Authorization Issue</h1>
        <p className="text-sm text-slate-600 leading-relaxed">{errorMessage}</p>
        <div className="pt-4 flex justify-center gap-4">
          <Link
            href="/checkout"
            className="px-6 py-2.5 bg-sky-600 text-white font-bold text-sm rounded-lg hover:bg-sky-700 transition"
          >
            ← Return to Checkout
          </Link>
          <Link
            href="/cart"
            className="px-6 py-2.5 border border-slate-300 text-slate-700 font-bold text-sm rounded-lg hover:bg-slate-50 transition"
          >
            View Cart
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-20 px-4 max-w-lg mx-auto text-center space-y-5">
      <div className="inline-flex p-4 rounded-full bg-sky-50 text-sky-600 mb-2">
        <svg className="animate-spin h-8 w-8" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      </div>
      <h1 className="text-2xl font-extrabold text-slate-900">Finalizing Your PayPal Order</h1>
      <p className="text-sm text-slate-500">
        Your payment was authorized by PayPal. Please wait a moment while we confirm stock and generate your commercial invoice...
      </p>
    </div>
  );
}

export default function PayPalReturnPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-sm text-slate-500">
          Loading PayPal order details...
        </div>
      }
    >
      <PayPalReturnContent />
    </Suspense>
  );
}
