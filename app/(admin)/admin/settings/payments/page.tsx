import React from "react";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { maskSensitiveString } from "@/lib/security";
import Link from "next/link";
import PaymentSettingsForm from "./PaymentSettingsForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Payment Gateway Configuration | Pinnacle Admin",
};

export default async function AdminPaymentSettingsPage() {
  const session = await getAuthSession();
  if (!session || !session.user || session.user.role !== "ADMIN") {
    redirect("/admin");
  }

  const settings = await prisma.globalSetting.findUnique({
    where: { id: "singleton" },
    select: {
      stripeEnabled: true,
      stripeTestMode: true,
      stripeTestPublishableKey: true,
      stripeTestSecretKey: true,
      stripeTestWebhookSecret: true,
      stripeLivePublishableKey: true,
      stripeLiveSecretKey: true,
      stripeLiveWebhookSecret: true,
      stripePublishableKey: true,
      stripeSecretKey: true,
      stripeWebhookSecret: true,
      paypalEnabled: true,
      paypalSandboxMode: true,
      paypalSandboxClientId: true,
      paypalSandboxClientSecret: true,
      paypalSandboxAppId: true,
      paypalLiveClientId: true,
      paypalLiveClientSecret: true,
      paypalLiveAppId: true,
    },
  });

  const hasTestSecret = Boolean(settings?.stripeTestSecretKey || settings?.stripeSecretKey);
  const hasTestWebhook = Boolean(settings?.stripeTestWebhookSecret || settings?.stripeWebhookSecret);
  const hasLiveSecret = Boolean(settings?.stripeLiveSecretKey);
  const hasLiveWebhook = Boolean(settings?.stripeLiveWebhookSecret);

  const hasSandboxSecret = Boolean(settings?.paypalSandboxClientSecret);
  const hasPayPalLiveSecret = Boolean(settings?.paypalLiveClientSecret);

  const initialData = {
    // Stripe
    stripeEnabled: Boolean(settings?.stripeEnabled),
    stripeTestMode: settings?.stripeTestMode !== false,
    stripeTestPublishableKey: settings?.stripeTestPublishableKey || settings?.stripePublishableKey || "",
    stripeTestSecretKeyMasked: hasTestSecret ? maskSensitiveString((settings!.stripeTestSecretKey || settings!.stripeSecretKey)!, 4) : "",
    hasTestSecretKey: hasTestSecret,
    stripeTestWebhookSecretMasked: hasTestWebhook ? maskSensitiveString((settings!.stripeTestWebhookSecret || settings!.stripeWebhookSecret)!, 4) : "",
    hasTestWebhookSecret: hasTestWebhook,

    stripeLivePublishableKey: settings?.stripeLivePublishableKey || "",
    stripeLiveSecretKeyMasked: hasLiveSecret ? maskSensitiveString(settings!.stripeLiveSecretKey!, 4) : "",
    hasLiveSecretKey: hasLiveSecret,
    stripeLiveWebhookSecretMasked: hasLiveWebhook ? maskSensitiveString(settings!.stripeLiveWebhookSecret!, 4) : "",
    hasLiveWebhookSecret: hasLiveWebhook,

    // PayPal
    paypalEnabled: Boolean(settings?.paypalEnabled),
    paypalSandboxMode: settings?.paypalSandboxMode !== false,
    paypalSandboxClientId: settings?.paypalSandboxClientId || "",
    paypalSandboxClientSecretMasked: hasSandboxSecret ? maskSensitiveString(settings!.paypalSandboxClientSecret, 4) : "",
    hasSandboxClientSecret: hasSandboxSecret,
    paypalSandboxAppId: settings?.paypalSandboxAppId || "WEBAPPTEST",
    paypalLiveClientId: settings?.paypalLiveClientId || "",
    paypalLiveClientSecretMasked: hasPayPalLiveSecret ? maskSensitiveString(settings!.paypalLiveClientSecret, 4) : "",
    hasLiveClientSecret: hasPayPalLiveSecret,
    paypalLiveAppId: settings?.paypalLiveAppId || "",
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header & Tabs */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Payment Gateways & Checkout Configuration
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Configure database-driven Stripe and PayPal credentials. Switch PayPal between Sandbox testing mode and Live production mode with independent API credentials.
        </p>
      </div>

      {/* Settings Subnavigation Tabs */}
      <div className="flex border-b border-slate-200">
        <Link
          href="/admin/settings"
          className="py-3 px-4 text-sm font-semibold text-slate-600 hover:text-slate-900 border-b-2 border-transparent transition-colors"
        >
          General & SMTP Settings
        </Link>
        <Link
          href="/admin/settings/payments"
          className="py-3 px-4 text-sm font-bold text-sky-600 border-b-2 border-sky-600 transition-colors"
        >
          Payment Gateways (Stripe & PayPal)
        </Link>
        <Link
          href="/admin/settings/freight"
          className="py-3 px-4 text-sm font-semibold text-slate-600 hover:text-slate-900 border-b-2 border-transparent transition-colors"
        >
          Freight & Shipping Methods
        </Link>
      </div>

      <PaymentSettingsForm initialData={initialData} />
    </div>
  );
}
