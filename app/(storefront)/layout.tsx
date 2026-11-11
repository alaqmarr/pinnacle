import React from "react";
import { getAuthSession, type UserRole } from "@/lib/auth";
import { getGlobalSettings, getPublicSettings } from "@/lib/settings";
import { SettingsProvider } from "@/context/SettingsContext";
import { CartProvider } from "@/context/CartContext";
import { Navbar } from "@/components/storefront/Navbar";
import { Footer } from "@/components/storefront/Footer";
import { CartDrawer } from "@/components/storefront/CartDrawer";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [rawSession, rawSettings, categories] = await Promise.all([
    getAuthSession(),
    getGlobalSettings(),
    prisma.category.findMany({
      select: { name: true, slug: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Verify user still exists in database so deleted/reset accounts never show ghost sessions
  let session = rawSession;
  if (rawSession?.user?.id) {
    const dbUser = await prisma.user
      .findUnique({
        where: { id: rawSession.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          allowCredit: true,
          allowPickup: true,
        },
      })
      .catch(() => null);

    if (!dbUser) {
      session = null;
    } else {
      session = {
        ...rawSession,
        user: {
          id: dbUser.id,
          name: dbUser.name || "",
          email: dbUser.email,
          role: (dbUser.role || "CUSTOMER") as UserRole,
          allowCredit: Boolean(dbUser.allowCredit),
          allowPickup: Boolean(dbUser.allowPickup),
        },
      };
    }
  }

  const publicSettings = getPublicSettings(rawSettings);

  return (
    <SettingsProvider settings={publicSettings}>
      <CartProvider>
        <div className="flex min-h-screen w-full flex-col bg-slate-50 text-slate-900 font-sans">
          <Navbar
            companyName={publicSettings.companyName}
            phone={publicSettings.contactPhone}
            categories={categories}
            session={session}
          />
          <main className="flex-1 w-full">{children}</main>
          <Footer settings={publicSettings} />
          <CartDrawer session={session} />
        </div>
      </CartProvider>
    </SettingsProvider>
  );
}
