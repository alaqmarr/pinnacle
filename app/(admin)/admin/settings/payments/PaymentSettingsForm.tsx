"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface PaymentSettingsData {
  stripePublishableKey: string;
  stripeSecretKeyMasked: string;
  hasSecretKey: boolean;
  stripeWebhookSecretMasked: string;
  hasWebhookSecret: boolean;
  stripeEnabled: boolean;
}

export default function PaymentSettingsForm({
  initialData,
}: {
  initialData: PaymentSettingsData;
}) {
  const router = useRouter();

  const [stripeEnabled, setStripeEnabled] = useState(initialData.stripeEnabled);
  const [publishableKey, setPublishableKey] = useState(initialData.stripePublishableKey);
  const [secretKey, setSecretKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);

  const [hasSecretKey, setHasSecretKey] = useState(initialData.hasSecretKey);
  const [secretKeyMasked, setSecretKeyMasked] = useState(initialData.stripeSecretKeyMasked);
  const [hasWebhookSecret, setHasWebhookSecret] = useState(initialData.hasWebhookSecret);
  const [webhookSecretMasked, setWebhookSecretMasked] = useState(initialData.stripeWebhookSecretMasked);

  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatus({ type: null, message: "" });

    try {
      const payload: any = {
        stripeEnabled,
        stripePublishableKey: publishableKey.trim() || null,
      };

      // Only send secret keys if user typed a new value
      if (secretKey.trim()) {
        payload.stripeSecretKey = secretKey.trim();
      }
      if (webhookSecret.trim()) {
        payload.stripeWebhookSecret = webhookSecret.trim();
      }

      const res = await fetch("/api/admin/settings/payments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to save Stripe settings");
      }

      setStatus({
        type: "success",
        message: "Stripe payment gateway configuration successfully saved to database.",
      });

      // Refresh masked values if new keys provided
      if (secretKey.trim()) {
        const visibleEnd = secretKey.trim().slice(-4);
        setSecretKeyMasked(`••••••••••••${visibleEnd}`);
        setHasSecretKey(true);
        setSecretKey("");
      }
      if (webhookSecret.trim()) {
        const visibleEnd = webhookSecret.trim().slice(-4);
        setWebhookSecretMasked(`••••••••••••${visibleEnd}`);
        setHasWebhookSecret(true);
        setWebhookSecret("");
      }

      router.refresh();
    } catch (err: any) {
      setStatus({
        type: "error",
        message: err.message || "Network error while saving settings",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* DB-Driven Security Callout */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 shadow-md">
        <div className="flex items-start space-x-3">
          <div className="p-1.5 bg-sky-500/20 text-sky-400 rounded-lg shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Database-Driven Credentials
            </h3>
            <p className="mt-1 text-xs text-slate-300 leading-relaxed">
              All payment credentials are saved directly into the SQLite database (<code className="text-sky-300 font-mono">GlobalSetting</code> model). In strict accordance with security standards, credentials are never written to or read from <code className="text-sky-300 font-mono">.env</code> files.
            </p>
          </div>
        </div>
      </div>

      {/* Status Feedback Banner */}
      {status.type && (
        <div
          className={`p-4 rounded-xl border text-sm font-medium flex items-center justify-between shadow-xs ${
            status.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center space-x-2">
            {status.type === "success" ? (
              <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span>{status.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatus({ type: null, message: "" })}
            className="text-xs font-bold underline ml-4 hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Settings Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100">
        {/* Gateway Enablement Toggle */}
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="stripe-toggle" className="text-base font-bold text-slate-900 cursor-pointer">
                Enable Stripe Gateway
              </label>
              <p className="text-xs text-slate-500 mt-0.5">
                When enabled, customers can select credit card checkout at checkout in addition to commercial Net-30 invoicing.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                id="stripe-toggle"
                type="checkbox"
                checked={stripeEnabled}
                onChange={(e) => setStripeEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
            </label>
          </div>
        </div>

        {/* API Keys Configuration */}
        <div className="p-6 space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Stripe API Keys & Secrets
          </h2>

          {/* Publishable Key */}
          <div>
            <label htmlFor="stripe-publishable-key" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Stripe Publishable Key
            </label>
            <div className="mt-1.5">
              <input
                id="stripe-publishable-key"
                type="text"
                placeholder="pk_test_... or pk_live_..."
                value={publishableKey}
                onChange={(e) => setPublishableKey(e.target.value)}
                className="w-full text-sm font-mono border border-slate-300 rounded-lg px-3.5 py-2.5 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Public client-side key for initializing Stripe.js in storefront checkout.
            </p>
          </div>

          {/* Secret Key */}
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="stripe-secret-key" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Stripe Secret Key
              </label>
              {hasSecretKey && (
                <span className="text-xs font-semibold text-emerald-600 flex items-center">
                  <span className="w-1.5 h-1.5 mr-1 bg-emerald-500 rounded-full" />
                  Stored: <code className="font-mono ml-1">{secretKeyMasked}</code>
                </span>
              )}
            </div>
            <div className="mt-1.5 relative">
              <input
                id="stripe-secret-key"
                type={showSecretKey ? "text" : "password"}
                placeholder={hasSecretKey ? "Leave blank to preserve currently stored key" : "sk_test_... or sk_live_..."}
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                className="w-full text-sm font-mono border border-slate-300 rounded-lg pl-3.5 pr-20 py-2.5 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <button
                type="button"
                onClick={() => setShowSecretKey(!showSecretKey)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-500 hover:text-slate-800 font-semibold"
              >
                {showSecretKey ? "Hide" : "Show"}
              </button>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Secret API key used on the server to create payment intents. Never exposed to browser clients.
            </p>
          </div>

          {/* Webhook Secret */}
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="stripe-webhook-secret" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Stripe Webhook Signing Secret
              </label>
              {hasWebhookSecret && (
                <span className="text-xs font-semibold text-emerald-600 flex items-center">
                  <span className="w-1.5 h-1.5 mr-1 bg-emerald-500 rounded-full" />
                  Stored: <code className="font-mono ml-1">{webhookSecretMasked}</code>
                </span>
              )}
            </div>
            <div className="mt-1.5 relative">
              <input
                id="stripe-webhook-secret"
                type={showWebhookSecret ? "text" : "password"}
                placeholder={hasWebhookSecret ? "Leave blank to preserve currently stored secret" : "whsec_..."}
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                className="w-full text-sm font-mono border border-slate-300 rounded-lg pl-3.5 pr-20 py-2.5 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <button
                type="button"
                onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-500 hover:text-slate-800 font-semibold"
              >
                {showWebhookSecret ? "Hide" : "Show"}
              </button>
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Used to cryptographically verify Stripe webhook event payloads for asynchronous order fulfillment.
            </p>
          </div>
        </div>

        {/* Form Actions */}
        <div className="p-6 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Changes apply immediately upon database commit.
          </span>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center px-5 py-2.5 text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving to Database...
              </>
            ) : (
              "Save Payment Settings"
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
