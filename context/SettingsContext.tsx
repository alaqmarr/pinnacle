"use client";

import React, { createContext, useContext, useMemo } from "react";
import { PublicGlobalSettings } from "@/lib/settings";

export interface SettingsContextType {
  ecommerceMode: boolean;
  whatsappNumber: string | null;
  settings: PublicGlobalSettings;
}

const DEFAULT_SETTINGS: PublicGlobalSettings = {
  companyName: "Pinnacle Distributing",
  contactEmail: "info@pinnacledistributing.com",
  contactPhone: "(800) 555-0199",
  address: "1234 Industrial Parkway, Suite 100, Dallas, TX 75201",
  warehouseAddress: "1234 Industrial Parkway, Suite 100, Dallas, TX 75201",
  hours: "Monday - Friday: 8:00 AM - 5:00 PM CST",
  businessHours: "Monday - Friday: 8:00 AM - 5:00 PM CST",
  mapEmbedUrl: null,
  notificationEmail: null,
  headScripts: null,
  bodyTopScripts: null,
  ecommerceMode: true,
  whatsappNumber: "+18005550199",
};

const SettingsContext = createContext<SettingsContextType>({
  ecommerceMode: true,
  whatsappNumber: "+18005550199",
  settings: DEFAULT_SETTINGS,
});

export function SettingsProvider({
  settings,
  children,
}: {
  settings: PublicGlobalSettings;
  children: React.ReactNode;
}) {
  const value = useMemo(
    () => ({
      ecommerceMode:
        settings?.ecommerceMode !== undefined ? Boolean(settings.ecommerceMode) : true,
      whatsappNumber: settings?.whatsappNumber ?? null,
      settings: settings || DEFAULT_SETTINGS,
    }),
    [settings]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext);
  return context;
}
