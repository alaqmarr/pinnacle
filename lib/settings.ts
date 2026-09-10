/**
 * lib/settings.ts
 * 
 * Dynamic database reader and writer for Pinnacle Distributing Global Settings.
 * Reads site configuration, contact details, map embed URLs, and SMTP configuration
 * directly from the SQLite GlobalSetting singleton table at runtime.
 * Zero hardcoded values in templates or communications.
 */

import { prisma } from "@/lib/prisma";

export const SETTINGS_SINGLETON_ID = "singleton";

export interface GlobalSettingData {
  id: string;
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  hours: string;
  mapEmbedUrl: string | null;
  smtpHost: string | null;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string | null;
  smtpPass: string | null;
  smtpFrom: string | null;
  smtpFromName: string;
  notificationEmail: string | null;
  headScripts?: string | null;
  bodyTopScripts?: string | null;
  stripePublishableKey?: string | null;
  stripeSecretKey?: string | null;
  stripeWebhookSecret?: string | null;
  stripeEnabled?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface PublicGlobalSettings {
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  hours: string;
  businessHours: string;
  mapEmbedUrl: string | null;
  notificationEmail: string | null;
  headScripts?: string | null;
  bodyTopScripts?: string | null;
}

export const DEFAULT_GLOBAL_SETTINGS: Omit<GlobalSettingData, "createdAt" | "updatedAt"> = {
  id: SETTINGS_SINGLETON_ID,
  companyName: "Pinnacle Distributing",
  contactEmail: "info@pinnacledistributing.com",
  contactPhone: "(800) 555-0199",
  address: "1234 Pinnacle Way, Suite 100, Dallas, TX 75201",
  hours: "Monday - Friday: 8:00 AM - 5:00 PM CST",
  mapEmbedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d107310.8872242183!2d-96.883733!3d32.820586!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x864e99157230c001%3A0x83f0f73f2c524029!2sDallas%2C%20TX!5e0!3m2!1sen!2sus!4v1700000000000!5m2!1sen!2sus",
  smtpHost: null,
  smtpPort: 587,
  smtpSecure: false,
  smtpUser: null,
  smtpPass: null,
  smtpFrom: "info@pinnacledistributing.com",
  smtpFromName: "Pinnacle Distributing",
  notificationEmail: "orders@pinnacledistributing.com",
  headScripts: null,
  bodyTopScripts: null,
  stripePublishableKey: null,
  stripeSecretKey: null,
  stripeWebhookSecret: null,
  stripeEnabled: false,
};

/**
 * Retrieves the global settings singleton record from the SQLite database.
 * If no record exists yet, creates and returns the default Pinnacle Distributing record.
 * Includes error recovery so server components never crash during initial builds or migrations.
 * 
 * @returns Promise<GlobalSettingData>
 */
export async function getGlobalSettings(): Promise<GlobalSettingData> {
  try {
    let settings = await prisma.globalSetting.findUnique({
      where: { id: SETTINGS_SINGLETON_ID },
    });

    if (!settings) {
      // Auto-bootstrap default settings record if table is currently empty
      try {
        settings = await prisma.globalSetting.create({
          data: {
            ...DEFAULT_GLOBAL_SETTINGS,
          },
        });
      } catch (raceError) {
        // Concurrency guard: if another thread created it simultaneously, fetch it
        settings = await prisma.globalSetting.findUnique({
          where: { id: SETTINGS_SINGLETON_ID },
        });
        if (!settings) {
          return DEFAULT_GLOBAL_SETTINGS as GlobalSettingData;
        }
      }
    }

    return settings as GlobalSettingData;
  } catch (dbError) {
    console.warn("[GlobalSettings] Database query failed, using in-memory default fallback:", dbError);
    return DEFAULT_GLOBAL_SETTINGS as GlobalSettingData;
  }
}

export type UpdateGlobalSettingsInput = Partial<{
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  hours: string;
  mapEmbedUrl: string | null;
  smtpHost: string | null;
  smtpPort: number | string | null;
  smtpSecure: boolean | string;
  smtpUser: string | null;
  smtpPass: string | null;
  smtpFrom: string | null;
  smtpFromName: string | null;
  notificationEmail: string | null;
  headScripts?: string | null;
  bodyTopScripts?: string | null;
  stripePublishableKey?: string | null;
  stripeSecretKey?: string | null;
  stripeWebhookSecret?: string | null;
  stripeEnabled?: boolean;
}>;

/**
 * Updates the global settings singleton record in the SQLite database.
 * Normalizes types and prevents empty password inputs from wiping existing SMTP passwords.
 * 
 * @param input - Partial settings fields to update.
 * @returns Promise<GlobalSettingData>
 */
export async function updateGlobalSettings(
  input: UpdateGlobalSettingsInput
): Promise<GlobalSettingData> {
  const updateData: Record<string, any> = { ...input };

  // Normalize businessHours to hours and remove from Prisma input
  if (updateData.businessHours !== undefined) {
    if (updateData.hours === undefined) {
      updateData.hours = String(updateData.businessHours).trim();
    }
    delete updateData.businessHours;
  }

  // Crucial security protection: do NOT overwrite existing password with empty string
  if (updateData.smtpPass === "" || updateData.smtpPass === undefined) {
    delete updateData.smtpPass;
  }

  // Normalize port to integer
  if (updateData.smtpPort !== undefined && updateData.smtpPort !== null) {
    const parsedPort = typeof updateData.smtpPort === "string" 
      ? parseInt(updateData.smtpPort, 10) 
      : updateData.smtpPort;
    updateData.smtpPort = isNaN(parsedPort) ? 587 : parsedPort;
  }

  // Normalize secure flag to boolean
  if (updateData.smtpSecure !== undefined) {
    updateData.smtpSecure = updateData.smtpSecure === true || updateData.smtpSecure === "true";
  }

  // Trim text fields
  const stringFields = [
    "companyName",
    "contactEmail",
    "contactPhone",
    "address",
    "hours",
    "mapEmbedUrl",
    "smtpHost",
    "smtpUser",
    "smtpFrom",
    "smtpFromName",
    "notificationEmail",
  ];
  for (const field of stringFields) {
    if (typeof updateData[field] === "string") {
      updateData[field] = updateData[field].trim();
    }
  }

  const updated = await prisma.globalSetting.upsert({
    where: { id: SETTINGS_SINGLETON_ID },
    update: {
      ...updateData,
      updatedAt: new Date(),
    },
    create: {
      ...DEFAULT_GLOBAL_SETTINGS,
      ...updateData,
      id: SETTINGS_SINGLETON_ID,
    },
  });

  return updated as GlobalSettingData;
}

/**
 * Returns a sanitized public version of site settings safe for client components and public API routes.
 * Strictly excludes SMTP passwords and usernames.
 * 
 * @param settings - GlobalSettingData
 * @returns PublicGlobalSettings
 */
export function getPublicSettings(settings: GlobalSettingData): PublicGlobalSettings {
  return {
    companyName: settings.companyName,
    contactEmail: settings.contactEmail,
    contactPhone: settings.contactPhone,
    address: settings.address,
    hours: settings.hours,
    businessHours: settings.hours,
    mapEmbedUrl: settings.mapEmbedUrl,
    notificationEmail: settings.notificationEmail,
    headScripts: settings.headScripts || null,
    bodyTopScripts: settings.bodyTopScripts || null,
  };
}
