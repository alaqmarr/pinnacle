"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export interface PaymentSettingsData {
  // Stripe
  stripePublishableKey: string;
  stripeSecretKeyMasked: string;
  hasSecretKey: boolean;
  stripeWebhookSecretMasked: string;
  hasWebhookSecret: boolean;
  stripeEnabled: boolean;

  // PayPal
  paypalEnabled: boolean;
  paypalSandboxMode: boolean;
  paypalSandboxClientId: string;
  paypalSandboxClientSecretMasked: string;
  hasSandboxClientSecret: boolean;
  paypalSandboxAppId: string;
  paypalLiveClientId: string;
  paypalLiveClientSecretMasked: string;
  hasLiveClientSecret: boolean;
  paypalLiveAppId: string;
}

export default function PaymentSettingsForm({
  initialData,
}: {
  initialData: PaymentSettingsData;
}) {
  const router = useRouter();

  // Active Gateway Tab
  const [activeTab, setActiveTab] = useState<"paypal" | "stripe">("paypal");

  // Stripe state
  const [stripeEnabled, setStripeEnabled] = useState(initialData.stripeEnabled);
  const [publishableKey, setPublishableKey] = useState(initialData.stripePublishableKey);
  const [stripeSecretKey, setStripeSecretKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [showStripeSecret, setShowStripeSecret] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [hasStripeSecret, setHasStripeSecret] = useState(initialData.hasSecretKey);
  const [stripeSecretMasked, setStripeSecretMasked] = useState(initialData.stripeSecretKeyMasked);
  const [hasWebhookSecretState, setHasWebhookSecretState] = useState(initialData.hasWebhookSecret);
  const [webhookSecretMasked, setWebhookSecretMasked] = useState(initialData.stripeWebhookSecretMasked);

  // PayPal state
  const [paypalEnabled, setPaypalEnabled] = useState(initialData.paypalEnabled);
  const [paypalSandboxMode, setPaypalSandboxMode] = useState(initialData.paypalSandboxMode);

  // Sandbox credentials
  const [sandboxClientId, setSandboxClientId] = useState(initialData.paypalSandboxClientId);
  const [sandboxClientSecret, setSandboxClientSecret] = useState("");
  const [showSandboxSecret, setShowSandboxSecret] = useState(false);
  const [sandboxAppId, setSandboxAppId] = useState(initialData.paypalSandboxAppId);
  const [hasSandboxSecret, setHasSandboxSecret] = useState(initialData.hasSandboxClientSecret);
  const [sandboxSecretMasked, setSandboxSecretMasked] = useState(initialData.paypalSandboxClientSecretMasked);

  // Live credentials
  const [liveClientId, setLiveClientId] = useState(initialData.paypalLiveClientId);
  const [liveClientSecret, setLiveClientSecret] = useState("");
  const [showLiveSecret, setShowLiveSecret] = useState(false);
  const [liveAppId, setLiveAppId] = useState(initialData.paypalLiveAppId);
  const [hasLiveSecret, setHasLiveSecret] = useState(initialData.hasLiveClientSecret);
  const [liveSecretMasked, setLiveSecretMasked] = useState(initialData.paypalLiveClientSecretMasked);

  // Status & loading states
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingPayPal, setIsTestingPayPal] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  const [paypalTestStatus, setPaypalTestStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleTestPayPal = async () => {
    setIsTestingPayPal(true);
    setPaypalTestStatus({ type: null, message: "" });

    try {
      // Test either currently typed keys or stored keys
      const payload: any = {
        sandboxMode: paypalSandboxMode,
      };

      if (paypalSandboxMode) {
        if (sandboxClientId.trim()) payload.clientId = sandboxClientId.trim();
        if (sandboxClientSecret.trim()) payload.clientSecret = sandboxClientSecret.trim();
      } else {
        if (liveClientId.trim()) payload.clientId = liveClientId.trim();
        if (liveClientSecret.trim()) payload.clientSecret = liveClientSecret.trim();
      }

      const res = await fetch("/api/admin/settings/payments/test-paypal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "PayPal connection test failed.");
      }

      setPaypalTestStatus({
        type: "success",
        message: data.message || `Successfully connected to PayPal ${paypalSandboxMode ? "Sandbox" : "Live"}!`,
      });
    } catch (err: any) {
      setPaypalTestStatus({
        type: "error",
        message: err.message || "Failed to communicate with PayPal.",
      });
    } finally {
      setIsTestingPayPal(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatus({ type: null, message: "" });

    try {
      const payload: any = {
        // Stripe
        stripeEnabled,
        stripePublishableKey: publishableKey.trim() || null,

        // PayPal
        paypalEnabled,
        paypalSandboxMode,
        paypalSandboxClientId: sandboxClientId.trim() || null,
        paypalSandboxAppId: sandboxAppId.trim() || null,
        paypalLiveClientId: liveClientId.trim() || null,
        paypalLiveAppId: liveAppId.trim() || null,
      };

      // Only update secrets if non-empty
      if (stripeSecretKey.trim()) {
        payload.stripeSecretKey = stripeSecretKey.trim();
      }
      if (webhookSecret.trim()) {
        payload.stripeWebhookSecret = webhookSecret.trim();
      }
      if (sandboxClientSecret.trim()) {
        payload.paypalSandboxClientSecret = sandboxClientSecret.trim();
      }
      if (liveClientSecret.trim()) {
        payload.paypalLiveClientSecret = liveClientSecret.trim();
      }

      const res = await fetch("/api/admin/settings/payments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to save payment settings");
      }

      setStatus({
        type: "success",
        message: "Payment gateway configurations successfully updated in database.",
      });

      // Update masked values locally if new secrets provided
      if (stripeSecretKey.trim()) {
        const visibleEnd = stripeSecretKey.trim().slice(-4);
        setStripeSecretMasked(`••••••••••••${visibleEnd}`);
        setHasStripeSecret(true);
        setStripeSecretKey("");
      }
      if (webhookSecret.trim()) {
        const visibleEnd = webhookSecret.trim().slice(-4);
        setWebhookSecretMasked(`••••••••••••${visibleEnd}`);
        setHasWebhookSecretState(true);
        setWebhookSecret("");
      }
      if (sandboxClientSecret.trim()) {
        const visibleEnd = sandboxClientSecret.trim().slice(-4);
        setSandboxSecretMasked(`••••••••••••${visibleEnd}`);
        setHasSandboxSecret(true);
        setSandboxClientSecret("");
      }
      if (liveClientSecret.trim()) {
        const visibleEnd = liveClientSecret.trim().slice(-4);
        setLiveSecretMasked(`••••••••••••${visibleEnd}`);
        setHasLiveSecret(true);
        setLiveClientSecret("");
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
      {/* Database-Driven Security Notice */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 shadow-md">
        <div className="flex items-start space-x-3">
          <div className="p-1.5 bg-sky-500/20 text-sky-400 rounded-lg shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Database-Driven Gateway Credentials
            </h3>
            <p className="mt-1 text-xs text-slate-300 leading-relaxed">
              All PayPal and Stripe keys are stored securely in SQLite (<code className="text-sky-300 font-mono">GlobalSetting</code> model). Environment mode (Sandbox vs Live) and credentials can be toggled without server restarts or environment variable modifications.
            </p>
          </div>
        </div>
      </div>

      {/* Global Status Feedback Banner */}
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

      {/* Gateway Switcher Tabs */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setActiveTab("paypal")}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-xl border text-sm font-bold transition-all ${
            activeTab === "paypal"
              ? "bg-white border-sky-600 text-sky-700 shadow-sm ring-2 ring-sky-100"
              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-white"
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
          PayPal Gateway
          {paypalEnabled && (
            <span className="ml-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Enabled
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("stripe")}
          className={`flex items-center gap-2.5 px-5 py-3 rounded-xl border text-sm font-bold transition-all ${
            activeTab === "stripe"
              ? "bg-white border-sky-600 text-sky-700 shadow-sm ring-2 ring-sky-100"
              : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-white"
          }`}
        >
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
          Stripe Gateway
          {stripeEnabled && (
            <span className="ml-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Enabled
            </span>
          )}
        </button>
      </div>

      {/* ======================================================== */}
      {/* PAYPAL CONFIGURATION CARD */}
      {/* ======================================================== */}
      {activeTab === "paypal" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100">
          {/* Header & Enablement Toggle */}
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-slate-900">
                    PayPal Payment Gateway
                  </h2>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      paypalSandboxMode
                        ? "bg-amber-100 text-amber-900 border border-amber-200"
                        : "bg-emerald-100 text-emerald-900 border border-emerald-200"
                    }`}
                  >
                    {paypalSandboxMode ? "🟡 Sandbox Mode Active" : "🟢 Live Mode Active"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Enables PayPal standard checkout, debit/credit cards, and pay later options directly on the storefront checkout.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-700">
                  {paypalEnabled ? "Enabled" : "Disabled"}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paypalEnabled}
                    onChange={(e) => setPaypalEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-sky-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Database Environment Mode Switcher */}
          <div className="p-6 bg-slate-50/60">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
              PayPal Operation Mode (Stored in Database)
            </label>
            <p className="text-xs text-slate-600 mb-4">
              Select which credential set the storefront and checkout order processor should actively use.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  paypalSandboxMode
                    ? "bg-white border-amber-500 ring-2 ring-amber-100 shadow-xs"
                    : "bg-white/60 border-slate-200 hover:border-slate-300 text-slate-600"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="paypalMode"
                    checked={paypalSandboxMode === true}
                    onChange={() => setPaypalSandboxMode(true)}
                    className="mt-1 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <strong className="text-sm font-bold text-slate-900 block flex items-center gap-2">
                      🟡 Sandbox Mode (Testing & QA)
                      {paypalSandboxMode && (
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                          ACTIVE
                        </span>
                      )}
                    </strong>
                    <span className="text-xs text-slate-500 block mt-1">
                      Uses Sandbox credentials. Connects to <code className="font-mono text-[11px] text-slate-700">api-m.sandbox.paypal.com</code> for safe test payments with zero real charges.
                    </span>
                  </div>
                </div>
              </label>

              <label
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  !paypalSandboxMode
                    ? "bg-white border-emerald-500 ring-2 ring-emerald-100 shadow-xs"
                    : "bg-white/60 border-slate-200 hover:border-slate-300 text-slate-600"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="paypalMode"
                    checked={paypalSandboxMode === false}
                    onChange={() => setPaypalSandboxMode(false)}
                    className="mt-1 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <strong className="text-sm font-bold text-slate-900 block flex items-center gap-2">
                      🟢 Live Mode (Production)
                      {!paypalSandboxMode && (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                          ACTIVE
                        </span>
                      )}
                    </strong>
                    <span className="text-xs text-slate-500 block mt-1">
                      Uses Live credentials. Connects to <code className="font-mono text-[11px] text-slate-700">api-m.paypal.com</code> for live commercial payment processing.
                    </span>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Test PayPal Connection Action Banner */}
          <div className="p-6 bg-slate-50 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <strong className="text-sm font-bold text-slate-900 block">
                  Verify Credentials with PayPal API
                </strong>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tests active OAuth token generation with PayPal {paypalSandboxMode ? "Sandbox" : "Live"} servers.
                </p>
              </div>
              <button
                type="button"
                onClick={handleTestPayPal}
                disabled={isTestingPayPal}
                className="inline-flex items-center px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 bg-white hover:bg-slate-100 transition-colors shadow-xs disabled:opacity-50"
              >
                {isTestingPayPal ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-slate-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-1.5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Test {paypalSandboxMode ? "Sandbox" : "Live"} Connection
                  </>
                )}
              </button>
            </div>

            {paypalTestStatus.type && (
              <div
                className={`mt-4 p-3.5 rounded-lg border text-xs font-medium flex items-center justify-between ${
                  paypalTestStatus.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : "bg-red-50 border-red-200 text-red-900"
                }`}
              >
                <div className="flex items-center gap-2">
                  {paypalTestStatus.type === "success" ? (
                    <span className="text-emerald-600 font-bold">✓</span>
                  ) : (
                    <span className="text-red-600 font-bold">✕</span>
                  )}
                  <span>{paypalTestStatus.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPaypalTestStatus({ type: null, message: "" })}
                  className="font-bold underline ml-2 hover:opacity-75"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>

          {/* Section 1: Sandbox Credentials */}
          <div className={`p-6 space-y-5 transition-opacity ${paypalSandboxMode ? "opacity-100" : "opacity-85"}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  Sandbox Credentials
                  {paypalSandboxMode && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      CURRENTLY IN USE
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Credentials for developer testing on <a href="https://sandbox.paypal.com" target="_blank" rel="noreferrer" className="text-sky-600 underline">sandbox.paypal.com</a>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Sandbox App Display Name
                </label>
                <input
                  type="text"
                  placeholder="WEBAPPTEST"
                  value={sandboxAppId}
                  onChange={(e) => setSandboxAppId(e.target.value)}
                  className="mt-1.5 w-full text-sm font-mono border border-slate-300 rounded-lg px-3.5 py-2.5 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Sandbox Client ID
                </label>
                <input
                  type="text"
                  placeholder="AYCbiJZNLJ-..."
                  value={sandboxClientId}
                  onChange={(e) => setSandboxClientId(e.target.value)}
                  className="mt-1.5 w-full text-sm font-mono border border-slate-300 rounded-lg px-3.5 py-2.5 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Sandbox Secret Key
                </label>
                {hasSandboxSecret && (
                  <span className="text-xs font-semibold text-emerald-600 flex items-center">
                    <span className="w-1.5 h-1.5 mr-1 bg-emerald-500 rounded-full" />
                    Stored: <code className="font-mono ml-1">{sandboxSecretMasked}</code>
                  </span>
                )}
              </div>
              <div className="mt-1.5 relative">
                <input
                  type={showSandboxSecret ? "text" : "password"}
                  placeholder={hasSandboxSecret ? "Leave blank to preserve currently stored key" : "EHJpNnvtSQh..."}
                  value={sandboxClientSecret}
                  onChange={(e) => setSandboxClientSecret(e.target.value)}
                  className="w-full text-sm font-mono border border-slate-300 rounded-lg pl-3.5 pr-20 py-2.5 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <button
                  type="button"
                  onClick={() => setShowSandboxSecret(!showSandboxSecret)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-500 hover:text-slate-800 font-semibold"
                >
                  {showSandboxSecret ? "Hide" : "Show"}
                </button>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Server-side secret key used to obtain OAuth tokens and capture sandbox transactions. Never exposed to browser clients.
              </p>
            </div>
          </div>

          {/* Section 2: Live Credentials */}
          <div className={`p-6 space-y-5 transition-opacity ${!paypalSandboxMode ? "opacity-100" : "opacity-85"}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  Live Production Credentials
                  {!paypalSandboxMode && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      CURRENTLY IN USE
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Production credentials generated in your <a href="https://developer.paypal.com/dashboard/applications/live" target="_blank" rel="noreferrer" className="text-sky-600 underline">PayPal Developer Dashboard</a>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Live App Display Name
                </label>
                <input
                  type="text"
                  placeholder="Pinnacle Distributing Production"
                  value={liveAppId}
                  onChange={(e) => setLiveAppId(e.target.value)}
                  className="mt-1.5 w-full text-sm font-mono border border-slate-300 rounded-lg px-3.5 py-2.5 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Live Client ID
                </label>
                <input
                  type="text"
                  placeholder="A..."
                  value={liveClientId}
                  onChange={(e) => setLiveClientId(e.target.value)}
                  className="mt-1.5 w-full text-sm font-mono border border-slate-300 rounded-lg px-3.5 py-2.5 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Live Secret Key
                </label>
                {hasLiveSecret && (
                  <span className="text-xs font-semibold text-emerald-600 flex items-center">
                    <span className="w-1.5 h-1.5 mr-1 bg-emerald-500 rounded-full" />
                    Stored: <code className="font-mono ml-1">{liveSecretMasked}</code>
                  </span>
                )}
              </div>
              <div className="mt-1.5 relative">
                <input
                  type={showLiveSecret ? "text" : "password"}
                  placeholder={hasLiveSecret ? "Leave blank to preserve currently stored key" : "E..."}
                  value={liveClientSecret}
                  onChange={(e) => setLiveClientSecret(e.target.value)}
                  className="w-full text-sm font-mono border border-slate-300 rounded-lg pl-3.5 pr-20 py-2.5 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <button
                  type="button"
                  onClick={() => setShowLiveSecret(!showLiveSecret)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-500 hover:text-slate-800 font-semibold"
                >
                  {showLiveSecret ? "Hide" : "Show"}
                </button>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Production secret key for live orders.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STRIPE CONFIGURATION CARD */}
      {/* ======================================================== */}
      {activeTab === "stripe" && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs divide-y divide-slate-100">
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

          <div className="p-6 space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              Stripe API Keys & Secrets
            </h2>

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

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="stripe-secret-key" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Stripe Secret Key
                </label>
                {hasStripeSecret && (
                  <span className="text-xs font-semibold text-emerald-600 flex items-center">
                    <span className="w-1.5 h-1.5 mr-1 bg-emerald-500 rounded-full" />
                    Stored: <code className="font-mono ml-1">{stripeSecretMasked}</code>
                  </span>
                )}
              </div>
              <div className="mt-1.5 relative">
                <input
                  id="stripe-secret-key"
                  type={showStripeSecret ? "text" : "password"}
                  placeholder={hasStripeSecret ? "Leave blank to preserve currently stored key" : "sk_test_... or sk_live_..."}
                  value={stripeSecretKey}
                  onChange={(e) => setStripeSecretKey(e.target.value)}
                  className="w-full text-sm font-mono border border-slate-300 rounded-lg pl-3.5 pr-20 py-2.5 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <button
                  type="button"
                  onClick={() => setShowStripeSecret(!showStripeSecret)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-500 hover:text-slate-800 font-semibold"
                >
                  {showStripeSecret ? "Hide" : "Show"}
                </button>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Secret API key used on the server to create payment intents.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="stripe-webhook-secret" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Stripe Webhook Signing Secret
                </label>
                {hasWebhookSecretState && (
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
                  placeholder={hasWebhookSecretState ? "Leave blank to preserve currently stored secret" : "whsec_..."}
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
                Used to cryptographically verify Stripe webhook event payloads.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Global Form Submit Action Bar */}
      <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between shadow-xs">
        <span className="text-xs text-slate-500">
          All changes apply immediately to storefront checkout upon saving.
        </span>
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center px-6 py-2.5 text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
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
            "Save All Payment Settings"
          )}
        </button>
      </div>
    </form>
  );
}
