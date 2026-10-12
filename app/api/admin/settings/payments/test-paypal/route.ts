/**
 * app/api/admin/settings/payments/test-paypal/route.ts
 *
 * Diagnostic endpoint to test PayPal credentials against PayPal REST OAuth API.
 * Admin-only security check.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyPayPalCredentials } from "@/lib/paypal";

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
    const { clientId, clientSecret, sandboxMode, useStored } = body;

    let targetClientId = clientId;
    let targetClientSecret = clientSecret;
    let targetSandboxMode = sandboxMode !== undefined ? Boolean(sandboxMode) : true;

    // If useStored is requested or no secrets passed in body, fetch from DB
    if (useStored || !targetClientId || !targetClientSecret) {
      const settings = await prisma.globalSetting.findUnique({
        where: { id: "singleton" },
      });

      if (targetSandboxMode) {
        targetClientId = targetClientId || settings?.paypalSandboxClientId;
        targetClientSecret = targetClientSecret || settings?.paypalSandboxClientSecret;
      } else {
        targetClientId = targetClientId || settings?.paypalLiveClientId;
        targetClientSecret = targetClientSecret || settings?.paypalLiveClientSecret;
      }
    }

    if (!targetClientId || !targetClientSecret) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing PayPal ${targetSandboxMode ? "Sandbox" : "Live"} Client ID or Secret Key.`,
        },
        { status: 400 }
      );
    }

    const result = await verifyPayPalCredentials({
      clientId: targetClientId,
      clientSecret: targetClientSecret,
      sandboxMode: targetSandboxMode,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          mode: targetSandboxMode ? "Sandbox" : "Live",
          error: result.error,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      mode: targetSandboxMode ? "Sandbox" : "Live",
      appId: result.appId,
      message: `Successfully connected to PayPal ${targetSandboxMode ? "Sandbox" : "Live"}! Valid OAuth access token generated for App ID: ${result.appId || "Verified"}.`,
    });
  } catch (error: any) {
    console.error("[Test PayPal API] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to test PayPal connection" },
      { status: 500 }
    );
  }
}
