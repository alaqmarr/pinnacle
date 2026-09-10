"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export interface SettingsState {
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  warehouseAddress?: string;
  businessHours: string;
  hours: string;
  mapEmbedUrl: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;
  smtpFrom: string;
  smtpFromName: string;
  notificationEmail: string;
}

export default function SettingsForm({
  initialSettings,
}: {
  initialSettings: SettingsState;
}) {
  const router = useRouter();
  const [formData, setFormData] = useState<SettingsState>(initialSettings);
  const [showPassword, setShowPassword] = useState(false);

  // Status feedback
  const [saveStatus, setSaveStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });
  const [isSaving, setIsSaving] = useState(false);

  // SMTP Test feedback
  const [smtpTestStatus, setSmtpTestStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
    code?: string;
  }>({ type: null, message: "" });
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => {
        const next = { ...prev, [name]: value };
        if (name === "businessHours") {
          next.hours = value;
        } else if (name === "hours") {
          next.businessHours = value;
        }
        return next;
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus({ type: null, message: "" });
    setIsSaving(true);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save settings");
      }

      setSaveStatus({
        type: "success",
        message: "Global settings and SMTP configuration saved successfully to database.",
      });
      router.refresh();
    } catch (err: any) {
      setSaveStatus({
        type: "error",
        message: err.message || "Failed to save settings.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestSmtp = async () => {
    setSmtpTestStatus({ type: null, message: "" });
    setIsTestingSmtp(true);

    try {
      const res = await fetch("/api/admin/test-smtp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smtpHost: formData.smtpHost,
          smtpPort: formData.smtpPort,
          smtpSecure: formData.smtpSecure,
          smtpUser: formData.smtpUser,
          smtpPass: formData.smtpPass,
          smtpFrom: formData.smtpFrom,
          smtpFromName: formData.smtpFromName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSmtpTestStatus({
          type: "error",
          message: data.error || "Failed to establish SMTP connection.",
          code: data.code,
        });
      } else {
        setSmtpTestStatus({
          type: "success",
          message: data.message || "SMTP connection established successfully!",
        });
      }
    } catch (err: any) {
      setSmtpTestStatus({
        type: "error",
        message: err.message || "Failed to test SMTP connection.",
      });
    } finally {
      setIsTestingSmtp(false);
    }
  };

  return (
    <form
      action="/api/admin/settings"
      method="PUT"
      onSubmit={handleSave}
      className="space-y-8"
    >
      {/* Save Notification */}
      {saveStatus.type && (
        <div
          className={`p-4 rounded-xl text-sm font-semibold border flex items-center justify-between shadow-xs ${
            saveStatus.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <div className="flex items-center space-x-2">
            <span>{saveStatus.type === "success" ? "✓" : "⚠"}</span>
            <span>{saveStatus.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setSaveStatus({ type: null, message: "" })}
            className="text-slate-400 hover:text-slate-600 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* SECTION 1: Company & Warehouse Information */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-lg font-bold text-slate-900">
            Company & Warehouse Information
          </h2>
          <p className="text-xs text-slate-500">
            Visible on the storefront header, contact page, and order confirmations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Company Name
            </label>
            <input
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="Pinnacle Distributing"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Support Phone
            </label>
            <input
              type="text"
              name="contactPhone"
              value={formData.contactPhone}
              onChange={handleChange}
              placeholder="(800) 555-0199"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Support Email
            </label>
            <input
              type="email"
              name="contactEmail"
              value={formData.contactEmail}
              onChange={handleChange}
              placeholder="info@pinnacledistributing.com"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Order Notification Email
            </label>
            <input
              type="email"
              name="notificationEmail"
              value={formData.notificationEmail}
              onChange={handleChange}
              placeholder="orders@pinnacledistributing.com"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="1234 Industrial Parkway, Suite 100, Dallas, TX 75201"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Business Hours
            </label>
            <input
              type="text"
              name="businessHours"
              value={formData.businessHours}
              onChange={handleChange}
              placeholder="Monday - Friday: 8:00 AM - 5:00 PM CST"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Default Warehouse Address (Origin Dispatch Fallback)
          </label>
          <input
            type="text"
            name="warehouseAddress"
            value={formData.warehouseAddress || ""}
            onChange={handleChange}
            placeholder="1234 Industrial Parkway, Suite 100, Dallas, TX 75201"
            className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
          <p className="text-xs text-slate-500 mt-1">
            Used as the default shipping origin dispatch location for products that do not specify a custom origin dispatch.
          </p>
        </div>
      </div>

      {/* SECTION 2: Map Embed Location */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-lg font-bold text-slate-900">
            Dallas Logistics Center Map
          </h2>
          <p className="text-xs text-slate-500">
            Google Maps embed URL shown on the public contact page.
          </p>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Map Embed URL
          </label>
          <input
            type="text"
            name="mapEmbedUrl"
            value={formData.mapEmbedUrl}
            onChange={handleChange}
            placeholder="https://www.google.com/maps/embed?..."
            className="w-full px-3.5 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
          />
        </div>

        {/* Live Map Preview */}
        <div>
          <span className="block text-xs font-bold text-slate-500 uppercase mb-2">
            Live Map Preview
          </span>
          <div className="w-full h-48 sm:h-64 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center">
            {formData.mapEmbedUrl ? (
              <iframe
                src={formData.mapEmbedUrl}
                title="Google Maps Location Preview"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            ) : (
              <div className="text-center p-6 text-slate-400">
                <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="text-xs">Enter a Google Maps embed URL above to see live preview.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 3: SMTP Nodemailer Configuration */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              SMTP Configuration
            </h2>
            <p className="text-xs text-slate-500">
              Nodemailer system credentials for customer receipts, dispatch alerts, and contact inquiries.
            </p>
          </div>
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200 self-start sm:self-auto">
            Gmail 16-char App Passwords Supported
          </span>
        </div>

        {/* Live SMTP Tester Feedback */}
        {smtpTestStatus.type && (
          <div
            className={`p-4 rounded-xl text-xs font-semibold border ${
              smtpTestStatus.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-amber-50 text-amber-900 border-amber-300"
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-bold flex items-center gap-1.5">
                  {smtpTestStatus.type === "success" ? "✓ SMTP Connection Verified" : "⚠ SMTP Verification Notice"}
                  {smtpTestStatus.code && (
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-amber-200 text-amber-900">
                      Code: {smtpTestStatus.code}
                    </span>
                  )}
                </p>
                <p className="mt-1 font-normal leading-relaxed">{smtpTestStatus.message}</p>
              </div>
              <button
                type="button"
                onClick={() => setSmtpTestStatus({ type: null, message: "" })}
                className="text-slate-400 hover:text-slate-600 font-bold ml-2"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              SMTP Host
            </label>
            <input
              type="text"
              name="smtpHost"
              value={formData.smtpHost}
              onChange={handleChange}
              placeholder="smtp.gmail.com"
              className="w-full px-3.5 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              SMTP Port
            </label>
            <input
              type="number"
              name="smtpPort"
              value={formData.smtpPort}
              onChange={handleChange}
              placeholder="587"
              className="w-full px-3.5 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              SMTP User
            </label>
            <input
              type="text"
              name="smtpUser"
              value={formData.smtpUser}
              onChange={handleChange}
              placeholder="your-email@gmail.com"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                SMTP Password
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-sky-600 hover:text-sky-800 font-semibold"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              name="smtpPass"
              value={formData.smtpPass}
              onChange={handleChange}
              placeholder="Gmail 16-character App Password"
              className="w-full px-3.5 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              For Gmail, use a 16-character App Password (spaces will be automatically stripped).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              From / Sender Email
            </label>
            <input
              type="text"
              name="smtpFrom"
              value={formData.smtpFrom}
              onChange={handleChange}
              placeholder="orders@pinnacledistributing.com"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              From / Sender Display Name
            </label>
            <input
              type="text"
              name="smtpFromName"
              value={formData.smtpFromName}
              onChange={handleChange}
              placeholder="Pinnacle Distributing Dispatch"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="smtpSecure"
            name="smtpSecure"
            checked={formData.smtpSecure}
            onChange={handleChange}
            className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
          />
          <label htmlFor="smtpSecure" className="text-xs font-semibold text-slate-700">
            Use SSL/TLS Secure Connection (Enable for Port 465, uncheck for Port 587 STARTTLS)
          </label>
        </div>

        {/* Live SMTP Tester Button */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-slate-900 block">
              Verify Outbound SMTP Delivery
            </span>
            <p className="text-[11px] text-slate-500">
              Performs real-time handshake with the configured SMTP host using Nodemailer.
            </p>
          </div>
          <button
            type="button"
            id="test-smtp-btn"
            onClick={handleTestSmtp}
            disabled={isTestingSmtp}
            className="inline-flex items-center justify-center px-4 py-2 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 active:bg-slate-200 border border-slate-300 rounded-lg shadow-xs transition-colors shrink-0 disabled:opacity-50"
          >
            {isTestingSmtp ? (
              <>
                <svg className="w-3.5 h-3.5 mr-1.5 animate-spin text-sky-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Testing Connection...
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 mr-1.5 text-sky-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Test SMTP Connection
              </>
            )}
          </button>
        </div>
      </div>

      {/* Form Submission Bar */}
      <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-200">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center px-6 py-2.5 text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Saving Settings...
            </>
          ) : (
            "Save Settings"
          )}
        </button>
      </div>
    </form>
  );
}
