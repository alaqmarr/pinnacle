/**
 * app/api/admin/settings/payments/route.ts
 * 
 * Stripe Payment Gateway Configuration API (Database-Driven)
 * - Strict requirement: Credentials stored in SQLite DB, never in .env
 * - GET: Retrieve publishable key, enablement status, and masked secret keys (Admin only)
 * - PUT: Save/update Stripe keys without overwriting masked/empty secrets (Admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { maskSensitiveString } from "@/lib/security";

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden", message: "Administrator privileges required" },
        { status: 403 }
      );
    }

    const settings = await prisma.globalSetting.findUnique({
      where: { id: "singleton" },
      select: {
        stripePublishableKey: true,
        stripeSecretKey: true,
        stripeWebhookSecret: true,
        stripeEnabled: true,
      },
    });

    const hasSecretKey = Boolean(settings?.stripeSecretKey);
    const hasWebhookSecret = Boolean(settings?.stripeWebhookSecret);

    return NextResponse.json({
      stripePublishableKey: settings?.stripePublishableKey || null,
      stripeSecretKeyMasked: hasSecretKey ? maskSensitiveString(settings!.stripeSecretKey, 4) : null,
      hasSecretKey,
      stripeWebhookSecretMasked: hasWebhookSecret ? maskSensitiveString(settings!.stripeWebhookSecret, 4) : null,
      hasWebhookSecret,
      stripeEnabled: Boolean(settings?.stripeEnabled),
    });
  } catch (error: any) {
    console.error("[Admin Payments API] GET error:", error);
    return NextResponse.json(
      { error: "InternalServerError", message: error.message || "Failed to fetch payment settings" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden", message: "Administrator privileges required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      stripePublishableKey,
      stripeSecretKey,
      stripeWebhookSecret,
      stripeEnabled,
    } = body || {};

    const updateData: {
      stripePublishableKey?: string | null;
      stripeSecretKey?: string;
      stripeWebhookSecret?: string;
      stripeEnabled?: boolean;
    } = {};

    if (stripeEnabled !== undefined) {
      updateData.stripeEnabled = Boolean(stripeEnabled);
    }

    if (stripePublishableKey !== undefined) {
      updateData.stripePublishableKey = stripePublishableKey ? String(stripePublishableKey).trim() : null;
    }

    // Protect secret key: If empty or containing bullet mask characters (•), preserve existing key in DB
    if (stripeSecretKey !== undefined && stripeSecretKey !== null) {
      const trimmedSecret = String(stripeSecretKey).trim();
      if (trimmedSecret && !trimmedSecret.includes("•")) {
        updateData.stripeSecretKey = trimmedSecret;
      }
    }

    // Protect webhook secret: If empty or containing bullet mask characters (•), preserve existing key in DB
    if (stripeWebhookSecret !== undefined && stripeWebhookSecret !== null) {
      const trimmedWebhook = String(stripeWebhookSecret).trim();
      if (trimmedWebhook && !trimmedWebhook.includes("•")) {
        updateData.stripeWebhookSecret = trimmedWebhook;
      }
    }

    await prisma.globalSetting.upsert({
      where: { id: "singleton" },
      update: updateData,
      create: {
        id: "singleton",
        ...updateData,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Stripe payment gateway configuration updated in database.",
    });
  } catch (error: any) {
    console.error("[Admin Payments API] PUT error:", error);
    return NextResponse.json(
      { error: "InternalServerError", message: error.message || "Failed to update payment settings" },
      { status: 500 }
    );
  }
}
