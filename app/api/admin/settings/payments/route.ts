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
        stripeEnabled: true,
        stripeTestMode: true,
        stripeTestPublishableKey: true,
        stripeTestSecretKey: true,
        stripeTestWebhookSecret: true,
        stripeLivePublishableKey: true,
        stripeLiveSecretKey: true,
        stripeLiveWebhookSecret: true,
        stripePublishableKey: true,
        stripeSecretKey: true,
        stripeWebhookSecret: true,
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

    const hasTestSecret = Boolean(settings?.stripeTestSecretKey || settings?.stripeSecretKey);
    const hasTestWebhook = Boolean(settings?.stripeTestWebhookSecret || settings?.stripeWebhookSecret);
    const hasLiveSecret = Boolean(settings?.stripeLiveSecretKey);
    const hasLiveWebhook = Boolean(settings?.stripeLiveWebhookSecret);
    const hasSandboxSecret = Boolean(settings?.paypalSandboxClientSecret);
    const hasPayPalLiveSecret = Boolean(settings?.paypalLiveClientSecret);

    return NextResponse.json({
      // Stripe settings
      stripeEnabled: Boolean(settings?.stripeEnabled),
      stripeTestMode: settings?.stripeTestMode !== false,
      stripeTestPublishableKey: settings?.stripeTestPublishableKey || settings?.stripePublishableKey || null,
      stripeTestSecretKeyMasked: hasTestSecret ? maskSensitiveString((settings!.stripeTestSecretKey || settings!.stripeSecretKey)!, 4) : null,
      hasTestSecretKey: hasTestSecret,
      stripeTestWebhookSecretMasked: hasTestWebhook ? maskSensitiveString((settings!.stripeTestWebhookSecret || settings!.stripeWebhookSecret)!, 4) : null,
      hasTestWebhookSecret: hasTestWebhook,
      stripeLivePublishableKey: settings?.stripeLivePublishableKey || null,
      stripeLiveSecretKeyMasked: hasLiveSecret ? maskSensitiveString(settings!.stripeLiveSecretKey!, 4) : null,
      hasLiveSecretKey: hasLiveSecret,
      stripeLiveWebhookSecretMasked: hasLiveWebhook ? maskSensitiveString(settings!.stripeLiveWebhookSecret!, 4) : null,
      hasLiveWebhookSecret: hasLiveWebhook,
      stripePublishableKey: settings?.stripePublishableKey || null,

      // PayPal settings
      paypalEnabled: Boolean(settings?.paypalEnabled),
      paypalSandboxMode: settings?.paypalSandboxMode !== false,
      paypalSandboxClientId: settings?.paypalSandboxClientId || null,
      paypalSandboxClientSecretMasked: hasSandboxSecret ? maskSensitiveString(settings!.paypalSandboxClientSecret, 4) : null,
      hasSandboxClientSecret: hasSandboxSecret,
      paypalSandboxAppId: settings?.paypalSandboxAppId || "WEBAPPTEST",
      paypalLiveClientId: settings?.paypalLiveClientId || null,
      paypalLiveClientSecretMasked: hasPayPalLiveSecret ? maskSensitiveString(settings!.paypalLiveClientSecret, 4) : null,
      hasLiveClientSecret: hasPayPalLiveSecret,
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
      stripeEnabled,
      stripeTestMode,
      stripeTestPublishableKey,
      stripeTestSecretKey,
      stripeTestWebhookSecret,
      stripeLivePublishableKey,
      stripeLiveSecretKey,
      stripeLiveWebhookSecret,
      stripePublishableKey,
      stripeSecretKey,
      stripeWebhookSecret,
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
      stripeEnabled?: boolean;
      stripeTestMode?: boolean;
      stripeTestPublishableKey?: string | null;
      stripeTestSecretKey?: string;
      stripeTestWebhookSecret?: string;
      stripeLivePublishableKey?: string | null;
      stripeLiveSecretKey?: string;
      stripeLiveWebhookSecret?: string;
      stripePublishableKey?: string | null;
      stripeSecretKey?: string;
      stripeWebhookSecret?: string;
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
    if (stripeTestMode !== undefined) {
      updateData.stripeTestMode = Boolean(stripeTestMode);
    }
    if (stripeTestPublishableKey !== undefined) {
      const val = stripeTestPublishableKey ? String(stripeTestPublishableKey).trim() : null;
      updateData.stripeTestPublishableKey = val;
      updateData.stripePublishableKey = val;
    }
    if (stripeTestSecretKey !== undefined && stripeTestSecretKey !== null) {
      const trimmedSecret = String(stripeTestSecretKey).trim();
      if (trimmedSecret && !trimmedSecret.includes("•")) {
        updateData.stripeTestSecretKey = trimmedSecret;
        updateData.stripeSecretKey = trimmedSecret;
      }
    }
    if (stripeTestWebhookSecret !== undefined && stripeTestWebhookSecret !== null) {
      const trimmedWebhook = String(stripeTestWebhookSecret).trim();
      if (trimmedWebhook && !trimmedWebhook.includes("•")) {
        updateData.stripeTestWebhookSecret = trimmedWebhook;
        updateData.stripeWebhookSecret = trimmedWebhook;
      }
    }
    if (stripeLivePublishableKey !== undefined) {
      updateData.stripeLivePublishableKey = stripeLivePublishableKey ? String(stripeLivePublishableKey).trim() : null;
    }
    if (stripeLiveSecretKey !== undefined && stripeLiveSecretKey !== null) {
      const trimmedSecret = String(stripeLiveSecretKey).trim();
      if (trimmedSecret && !trimmedSecret.includes("•")) {
        updateData.stripeLiveSecretKey = trimmedSecret;
      }
    }
    if (stripeLiveWebhookSecret !== undefined && stripeLiveWebhookSecret !== null) {
      const trimmedWebhook = String(stripeLiveWebhookSecret).trim();
      if (trimmedWebhook && !trimmedWebhook.includes("•")) {
        updateData.stripeLiveWebhookSecret = trimmedWebhook;
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
