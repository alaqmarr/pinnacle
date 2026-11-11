/**
 * app/api/admin/settings/payments/test-stripe/route.ts
 *
 * Diagnostic endpoint to test Stripe API credentials against Stripe REST API.
 * Admin-only security check.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyStripeCredentials } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden", message: "Administrator privileges required" },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { secretKey, testMode, useStored } = body;

    let targetSecretKey = secretKey;
    const targetTestMode = testMode !== undefined ? Boolean(testMode) : true;

    // If useStored is requested or no secret passed in body, fetch from DB
    if (useStored || !targetSecretKey) {
      const settings = await prisma.globalSetting.findUnique({
        where: { id: "singleton" },
      });

      if (targetTestMode) {
        targetSecretKey =
          targetSecretKey ||
          settings?.stripeTestSecretKey ||
          settings?.stripeSecretKey;
      } else {
        targetSecretKey = targetSecretKey || settings?.stripeLiveSecretKey;
      }
    }

    if (!targetSecretKey) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing Stripe ${targetTestMode ? "Test" : "Live"} Secret Key. Please enter or save your secret key first.`,
        },
        { status: 400 }
      );
    }

    const result = await verifyStripeCredentials({
      secretKey: targetSecretKey,
      testMode: targetTestMode,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          mode: targetTestMode ? "Test" : "Live",
          error: result.error,
        },
        { status: 400 }
      );
    }

    const actualMode = result.livemode ? "Live" : "Test";

    return NextResponse.json({
      success: true,
      mode: targetTestMode ? "Test" : "Live",
      livemode: result.livemode,
      message: `Successfully connected to Stripe! Key is valid and operating in ${actualMode} mode.`,
    });
  } catch (error: any) {
    console.error("[Test Stripe API] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to test Stripe connection" },
      { status: 500 }
    );
  }
}
