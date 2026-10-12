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
      stripePublishableKey: true,
      stripeSecretKey: true,
      stripeWebhookSecret: true,
      stripeEnabled: true,
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

  const hasSecretKey = Boolean(settings?.stripeSecretKey);
  const hasWebhookSecret = Boolean(settings?.stripeWebhookSecret);
  const hasSandboxSecret = Boolean(settings?.paypalSandboxClientSecret);
  const hasLiveSecret = Boolean(settings?.paypalLiveClientSecret);

  const initialData = {
    // Stripe
    stripePublishableKey: settings?.stripePublishableKey || "",
    stripeSecretKeyMasked: hasSecretKey ? maskSensitiveString(settings!.stripeSecretKey, 4) : "",
    hasSecretKey,
    stripeWebhookSecretMasked: hasWebhookSecret ? maskSensitiveString(settings!.stripeWebhookSecret, 4) : "",
    hasWebhookSecret,
    stripeEnabled: Boolean(settings?.stripeEnabled),

    // PayPal
    paypalEnabled: Boolean(settings?.paypalEnabled),
    paypalSandboxMode: settings?.paypalSandboxMode !== false,
    paypalSandboxClientId: settings?.paypalSandboxClientId || "",
    paypalSandboxClientSecretMasked: hasSandboxSecret ? maskSensitiveString(settings!.paypalSandboxClientSecret, 4) : "",
    hasSandboxClientSecret: hasSandboxSecret,
    paypalSandboxAppId: settings?.paypalSandboxAppId || "WEBAPPTEST",
    paypalLiveClientId: settings?.paypalLiveClientId || "",
    paypalLiveClientSecretMasked: hasLiveSecret ? maskSensitiveString(settings!.paypalLiveClientSecret, 4) : "",
    hasLiveClientSecret: hasLiveSecret,
    paypalLiveAppId: settings?.paypalLiveAppId || "",
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
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
