import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatUSD } from "@/lib/currency";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Order Confirmed | Pinnacle Distributing",
  description: "Your Pinnacle Distributing commercial order confirmation receipt.",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

interface SuccessPageProps {
  searchParams: Promise<{ orderId?: string; orderNumber?: string }>;
}

export default async function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  const resolved = await searchParams;
  const orderIdentifier = resolved.orderNumber || resolved.orderId;

  // Requirement: Navigating to /checkout/success without orderNumber redirects away
  if (!orderIdentifier) {
    redirect("/products");
  }

  let order: any = null;
  try {
    order = await prisma.order.findFirst({
      where: {
        OR: [{ orderNumber: orderIdentifier }, { id: orderIdentifier }],
      },
      include: {
        items: true,
        shippingAddress: true,
      },
    });
  } catch (err) {
    console.error("[CheckoutSuccess] Error retrieving order:", err);
  }

  if (!order) {
    redirect("/products");
  }

  const isQuote = order.status === "QUOTE_REQUESTED" || order.paymentMethod === "QUOTE";

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto w-full">
      <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 shadow-sm text-center space-y-8">
        {/* Animated Badge */}
        {isQuote ? (
          <div className="w-16 h-16 rounded-full bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center mx-auto shadow-xs">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        ) : (
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}

        <div>
          <span className={`text-xs font-bold uppercase tracking-wider block mb-1 ${isQuote ? "text-purple-600" : "text-emerald-600"}`}>
            {isQuote ? "Quote Request Received" : "Order Confirmed"}
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            {isQuote ? "Quote Request Received!" : "Order Confirmed!"}
          </h1>
          <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            {isQuote ? (
              <>
                Thank you, <strong className="text-slate-900">{order.customerName}</strong>! Your quote request has been routed to our commercial distribution team. A dedicated sales specialist will review your item requirements, warehouse freight logistics, and wholesale volume pricing, then reach out within 1 business day.
              </>
            ) : (
              <>
                Thank you, <strong className="text-slate-900">{order.customerName}</strong>! Your industrial packaging and janitorial supplies order has been authorized and queued for warehouse freight dispatch.
              </>
            )}
          </p>
        </div>

        <div className="text-left bg-slate-50 rounded-xl border border-slate-200 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200">
            <div>
              <span className="text-xs text-slate-400 font-mono uppercase block">
                {isQuote ? "Quote Reference" : "Order Identifier"}
              </span>
              <strong className="text-lg font-mono font-bold text-slate-900">{order.orderNumber}</strong>
            </div>
            <div className="sm:text-right">
              <span className="text-xs text-slate-400 font-mono uppercase block">Status</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isQuote ? "bg-purple-100 text-purple-800" : "bg-sky-100 text-sky-800"
              }`}>
                {order.status}
              </span>
            </div>
          </div>

          {/* Line Items Recap */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              {isQuote ? "Requested Items" : "Purchased Items"} ({order.items.length})
            </h3>
            <div className="divide-y divide-slate-200/80">
              {order.items.map((item: any) => (
                <div key={item.id} className="py-2.5 flex justify-between items-center text-xs">
                  <div>
                    <strong className="text-slate-900 block">{item.name}</strong>
                    <span className="text-slate-500 font-mono text-[11px]">
                      Qty: {item.quantity} {item.sku ? `• SKU: ${item.sku}` : ""}{!isQuote ? ` × ${formatUSD(item.price)}` : ""}
                    </span>
                  </div>
                  <span className={`font-mono ${isQuote ? "text-xs font-medium text-slate-500 italic" : "font-bold text-slate-900"}`}>
                    {isQuote ? "Quote on Request" : formatUSD(item.total)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Summary or Quote Notice */}
          {isQuote ? (
            <div className="pt-4 border-t border-slate-200">
              <div className="p-3 bg-amber-50/80 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <span className="font-bold block">Commercial Pricing & Freight</span>
                  <span>Item wholesale unit pricing, freight carrier rates, and any applicable tax exemptions will be detailed on your formal sales quotation.</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="pt-4 border-t border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal:</span>
                <span className="font-medium font-mono">{formatUSD(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Freight Shipping:</span>
                <span className="font-medium font-mono">{formatUSD(order.shipping)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-extrabold text-slate-900">
                <span>Grand Total (USD):</span>
                <span className="text-base text-slate-900 font-mono">{formatUSD(order.total)}</span>
              </div>
            </div>
          )}

          {/* Shipping Destination */}
          {order.shippingAddress && (
            <div className="pt-4 border-t border-slate-200 text-xs text-slate-600 space-y-1">
              <strong className="text-slate-900 block font-bold uppercase tracking-wider mb-1">
                Freight Destination:
              </strong>
              <p>{order.shippingAddress.fullName}</p>
              {order.shippingAddress.company && <p>{order.shippingAddress.company}</p>}
              <p>{order.shippingAddress.addressLine1}</p>
              {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <Link href="/products">
            <Button variant="primary" size="lg">
              {isQuote ? "Continue Browsing Catalog" : "Continue Shopping"}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
