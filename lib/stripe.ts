/**
 * lib/stripe.ts
 *
 * Database-Driven Stripe Payment Gateway Integration for Pinnacle Distributing.
 * - Dynamic credentials read from SQLite GlobalSetting singleton.
 * - Supports instant toggle between Test Mode (Sandbox) and Live Production Mode.
 * - Credential verification, payment intent creation, and customer payment processing.
 */

import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export interface StripeResolvedConfig {
  enabled: boolean;
  testMode: boolean;
  publishableKey: string | null;
  secretKey: string | null;
  webhookSecret: string | null;
}

/**
 * Resolves the currently active Stripe configuration directly from SQLite GlobalSetting.
 */
export async function getStripeConfig(modeOverride?: boolean): Promise<StripeResolvedConfig> {
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
    },
  });

  // If explicit mode override provided, honor it; otherwise read from database (defaults to true)
  let testMode = modeOverride !== undefined ? modeOverride : settings?.stripeTestMode !== false;

  // Resilient safeguard: If Live mode is requested but Live keys are missing or placeholders,
  // gracefully fall back to Test mode so the store never crashes.
  const liveSecret = settings?.stripeLiveSecretKey?.trim();
  const livePublishable = settings?.stripeLivePublishableKey?.trim();
  const hasLiveKeys =
    Boolean(liveSecret && livePublishable) &&
    !liveSecret?.includes("PLACEHOLDER") &&
    !livePublishable?.includes("PLACEHOLDER");

  if (!testMode && !hasLiveKeys) {
    console.warn(
      "[Stripe] Live mode requested but live keys are empty or placeholders. Falling back to Test mode."
    );
    testMode = true;
  }

  const enabled = Boolean(settings?.stripeEnabled);

  const publishableKey = testMode
    ? settings?.stripeTestPublishableKey || settings?.stripePublishableKey || null
    : settings?.stripeLivePublishableKey || null;

  const secretKey = testMode
    ? settings?.stripeTestSecretKey || settings?.stripeSecretKey || null
    : settings?.stripeLiveSecretKey || null;

  const webhookSecret = testMode
    ? settings?.stripeTestWebhookSecret || settings?.stripeWebhookSecret || null
    : settings?.stripeLiveWebhookSecret || null;

  return {
    enabled,
    testMode,
    publishableKey: publishableKey ? publishableKey.trim() : null,
    secretKey: secretKey ? secretKey.trim() : null,
    webhookSecret: webhookSecret ? webhookSecret.trim() : null,
  };
}

/**
 * Instantiates and returns a Stripe API Client using active database credentials.
 */
export async function getStripeClient(modeOverride?: boolean): Promise<{
  stripe: Stripe;
  config: StripeResolvedConfig;
}> {
  const config = await getStripeConfig(modeOverride);

  if (!config.enabled) {
    throw new Error("Stripe payment processing is currently disabled in database settings.");
  }

  if (!config.secretKey) {
    const modeLabel = config.testMode ? "Test" : "Live";
    throw new Error(
      `Stripe ${modeLabel} Secret Key is not configured in Admin > Settings > Payments.`
    );
  }

  const stripe = new Stripe(config.secretKey, {
    apiVersion: "2026-08-26.dahlia" as any,
  });

  return { stripe, config };
}

/**
 * Tests credentials against Stripe REST API to verify validity.
 */
export async function verifyStripeCredentials(credentials: {
  secretKey: string;
  testMode?: boolean;
}): Promise<{
  success: boolean;
  livemode?: boolean;
  error?: string;
}> {
  try {
    const trimmed = credentials.secretKey.trim();
    if (!trimmed) {
      return { success: false, error: "Stripe Secret Key is empty." };
    }

    const stripe = new Stripe(trimmed, {
      apiVersion: "2026-08-26.dahlia" as any,
    });

    const balance = await stripe.balance.retrieve();

    return {
      success: true,
      livemode: balance.livemode,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to authenticate with Stripe API.",
    };
  }
}
