import React from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getGlobalSettings, getPublicSettings } from "@/lib/settings";
import { CartProvider } from "@/context/CartContext";
import { Navbar } from "@/components/storefront/Navbar";
import { Footer } from "@/components/storefront/Footer";
import { CartDrawer } from "@/components/storefront/CartDrawer";
import prisma from "@/lib/prisma";

// Dynamic runtime configuration: revalidate periodically or render dynamically
export const dynamic = "force-dynamic";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const rawSettings = await getGlobalSettings();
  const publicSettings = getPublicSettings(rawSettings);

  // Fetch categories dynamically so Navbar isn't populated with hardcoded dummy data
  const categories = await prisma.category.findMany({
    select: { name: true, slug: true },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 font-sans">
        <Navbar
          companyName={publicSettings.companyName}
          phone={publicSettings.contactPhone}
          categories={categories}
          session={session}
        />
        <main className="flex-1">{children}</main>
        <Footer settings={publicSettings} />
        <CartDrawer session={session} />
      </div>
    </CartProvider>
  );
}
