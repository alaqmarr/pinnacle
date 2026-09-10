import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { CheckoutClient } from "@/components/storefront/CheckoutClient";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Multi-Step Checkout | Pinnacle Distributing",
  description:
    "Complete your wholesale packaging and janitorial supplies order. Multi-step freight shipping, 5-digit US ZIP address verification, and instant confirmation.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function CheckoutPage() {
  const session = await getServerSession(authOptions);
  
  const settings = await prisma.globalSetting.findUnique({
    where: { id: "singleton" }
  });

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-slate-900 transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/cart" className="hover:text-slate-900 transition-colors">
          Cart
        </Link>
        <span>/</span>
        <span className="font-semibold text-slate-900">Multi-Step Checkout</span>
      </nav>

      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Multi-Step Checkout & Commercial Dispatch
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Provide your Shipping Address and choose your freight carrier preference.
        </p>
      </div>

      <CheckoutClient 
        sessionUser={session?.user || null} 
        stripePublishableKey={settings?.stripeEnabled ? (settings?.stripePublishableKey || undefined) : undefined}
      />
    </div>
  );
}
