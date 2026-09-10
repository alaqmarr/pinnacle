import React from "react";
import { getGlobalSettings } from "@/lib/settings";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getGlobalSettings();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1
          className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight"
          dangerouslySetInnerHTML={{ __html: "Global Settings & SMTP Configuration" }}
        />
        <p className="mt-1 text-sm text-slate-500">
          Configure site-wide company information, Dallas warehouse location map, and system Nodemailer SMTP delivery.
        </p>
      </div>

      <SettingsForm
        initialSettings={{
          companyName: settings.companyName,
          contactEmail: settings.contactEmail,
          contactPhone: settings.contactPhone,
          address: settings.address,
          warehouseAddress: settings.warehouseAddress || settings.address || "",
          businessHours: settings.hours,
          hours: settings.hours,
          mapEmbedUrl: settings.mapEmbedUrl || "",
          smtpHost: settings.smtpHost || "",
          smtpPort: settings.smtpPort || 587,
          smtpSecure: settings.smtpSecure || false,
          smtpUser: settings.smtpUser || "",
          smtpPass: settings.smtpPass || "",
          smtpFrom: settings.smtpFrom || "",
          smtpFromName: settings.smtpFromName || "Pinnacle Distributing",
          notificationEmail: settings.notificationEmail || "",
        }}
      />
    </div>
  );
}
