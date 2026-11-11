import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { CheckoutClient } from "@/components/storefront/CheckoutClient";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
  const session = await getAuthSession();
  
  const settings = await prisma.globalSetting.findUnique({
    where: { id: "singleton" }
  });

  let savedAddresses: any[] = [];
  let freightMethods: any[] = [];
  let verifiedUser: any = null;
  
  if (session?.user?.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        allowCredit: true,
        allowPickup: true,
      },
    });
    if (dbUser) {
      verifiedUser = dbUser;
      savedAddresses = await prisma.address.findMany({
        where: { userId: dbUser.id },
        orderBy: { createdAt: "desc" },
      });
    }
  }

  freightMethods = await prisma.freightMethod.findMany({
    where: { active: true },
    orderBy: { cost: "asc" }
  });

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-10 xl:px-12 w-full space-y-8">
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

      {/* Resolve Stripe credentials based on active mode (Test vs Live) */}
      {(() => {
        const stripeTestMode = settings?.stripeTestMode !== false;
        const activeStripePublishableKey = settings?.stripeEnabled
          ? (stripeTestMode
              ? settings?.stripeTestPublishableKey || settings?.stripePublishableKey
              : settings?.stripeLivePublishableKey) || undefined
          : undefined;

        return (
          <CheckoutClient 
            sessionUser={verifiedUser} 
            savedAddresses={savedAddresses}
            freightMethods={freightMethods}
            stripePublishableKey={activeStripePublishableKey}
            stripeTestMode={stripeTestMode}
            paypalEnabled={Boolean(settings?.paypalEnabled)}
            paypalClientId={
              settings?.paypalEnabled
                ? (settings.paypalSandboxMode !== false
                    ? settings.paypalSandboxClientId
                    : settings.paypalLiveClientId) || undefined
                : undefined
            }
            paypalSandboxMode={settings?.paypalSandboxMode !== false}
          />
        );
      })()}
    </div>
  );
}
