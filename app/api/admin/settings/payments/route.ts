/**
 * app/api/admin/settings/payments/route.ts
 * 
 * Payment Gateway Configuration API (Database-Driven: Stripe & PayPal)
 * - Strict requirement: Credentials stored in SQLite DB, never in .env
 * - Supports PayPal Sandbox Mode toggle and separate Sandbox & Live credentials
 * - GET: Retrieve Stripe & PayPal public keys, enablement status, mode, and masked secret keys (Admin only)
 * - PUT: Save/update keys without overwriting masked/empty secrets (Admin only)
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

    const hasStripeSecretKey = Boolean(settings?.stripeSecretKey);
    const hasStripeWebhookSecret = Boolean(settings?.stripeWebhookSecret);
    const hasSandboxSecret = Boolean(settings?.paypalSandboxClientSecret);
    const hasLiveSecret = Boolean(settings?.paypalLiveClientSecret);

    return NextResponse.json({
      // Stripe settings
      stripePublishableKey: settings?.stripePublishableKey || null,
      stripeSecretKeyMasked: hasStripeSecretKey ? maskSensitiveString(settings!.stripeSecretKey, 4) : null,
      hasSecretKey: hasStripeSecretKey,
      stripeWebhookSecretMasked: hasStripeWebhookSecret ? maskSensitiveString(settings!.stripeWebhookSecret, 4) : null,
      hasWebhookSecret: hasStripeWebhookSecret,
      stripeEnabled: Boolean(settings?.stripeEnabled),

      // PayPal settings
      paypalEnabled: Boolean(settings?.paypalEnabled),
      paypalSandboxMode: settings?.paypalSandboxMode !== false,
      paypalSandboxClientId: settings?.paypalSandboxClientId || null,
      paypalSandboxClientSecretMasked: hasSandboxSecret ? maskSensitiveString(settings!.paypalSandboxClientSecret, 4) : null,
      hasSandboxClientSecret: hasSandboxSecret,
      paypalSandboxAppId: settings?.paypalSandboxAppId || "WEBAPPTEST",
      paypalLiveClientId: settings?.paypalLiveClientId || null,
      paypalLiveClientSecretMasked: hasLiveSecret ? maskSensitiveString(settings!.paypalLiveClientSecret, 4) : null,
      hasLiveClientSecret: hasLiveSecret,
      paypalLiveAppId: settings?.paypalLiveAppId || null,
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
      // Stripe
      stripePublishableKey,
      stripeSecretKey,
      stripeWebhookSecret,
      stripeEnabled,
      // PayPal
      paypalEnabled,
      paypalSandboxMode,
      paypalSandboxClientId,
      paypalSandboxClientSecret,
      paypalSandboxAppId,
      paypalLiveClientId,
      paypalLiveClientSecret,
      paypalLiveAppId,
    } = body || {};

    const updateData: {
      stripePublishableKey?: string | null;
      stripeSecretKey?: string;
      stripeWebhookSecret?: string;
      stripeEnabled?: boolean;
      paypalEnabled?: boolean;
      paypalSandboxMode?: boolean;
      paypalSandboxClientId?: string | null;
      paypalSandboxClientSecret?: string;
      paypalSandboxAppId?: string | null;
      paypalLiveClientId?: string | null;
      paypalLiveClientSecret?: string;
      paypalLiveAppId?: string | null;
    } = {};

    // Stripe updates
    if (stripeEnabled !== undefined) {
      updateData.stripeEnabled = Boolean(stripeEnabled);
    }
    if (stripePublishableKey !== undefined) {
      updateData.stripePublishableKey = stripePublishableKey ? String(stripePublishableKey).trim() : null;
    }
    if (stripeSecretKey !== undefined && stripeSecretKey !== null) {
      const trimmedSecret = String(stripeSecretKey).trim();
      if (trimmedSecret && !trimmedSecret.includes("•")) {
        updateData.stripeSecretKey = trimmedSecret;
      }
    }
    if (stripeWebhookSecret !== undefined && stripeWebhookSecret !== null) {
      const trimmedWebhook = String(stripeWebhookSecret).trim();
      if (trimmedWebhook && !trimmedWebhook.includes("•")) {
        updateData.stripeWebhookSecret = trimmedWebhook;
      }
    }

    // PayPal updates
    if (paypalEnabled !== undefined) {
      updateData.paypalEnabled = Boolean(paypalEnabled);
    }
    if (paypalSandboxMode !== undefined) {
      updateData.paypalSandboxMode = Boolean(paypalSandboxMode);
    }
    if (paypalSandboxClientId !== undefined) {
      updateData.paypalSandboxClientId = paypalSandboxClientId ? String(paypalSandboxClientId).trim() : null;
    }
    if (paypalSandboxClientSecret !== undefined && paypalSandboxClientSecret !== null) {
      const trimmed = String(paypalSandboxClientSecret).trim();
      if (trimmed && !trimmed.includes("•")) {
        updateData.paypalSandboxClientSecret = trimmed;
      }
    }
    if (paypalSandboxAppId !== undefined) {
      updateData.paypalSandboxAppId = paypalSandboxAppId ? String(paypalSandboxAppId).trim() : null;
    }
    if (paypalLiveClientId !== undefined) {
      updateData.paypalLiveClientId = paypalLiveClientId ? String(paypalLiveClientId).trim() : null;
    }
    if (paypalLiveClientSecret !== undefined && paypalLiveClientSecret !== null) {
      const trimmed = String(paypalLiveClientSecret).trim();
      if (trimmed && !trimmed.includes("•")) {
        updateData.paypalLiveClientSecret = trimmed;
      }
    }
    if (paypalLiveAppId !== undefined) {
      updateData.paypalLiveAppId = paypalLiveAppId ? String(paypalLiveAppId).trim() : null;
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
      message: "Payment gateway configuration updated successfully in database.",
    });
  } catch (error: any) {
    console.error("[Admin Payments API] PUT error:", error);
    return NextResponse.json(
      { error: "InternalServerError", message: error.message || "Failed to update payment settings" },
      { status: 500 }
    );
  }
}
