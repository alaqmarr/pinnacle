/**
 * lib/paypal.ts
 *
 * Database-Driven PayPal REST API Integration for Pinnacle Distributing.
 * - Dynamic credentials read from SQLite GlobalSetting singleton.
 * - Supports instant toggle between Sandbox Mode and Live Production Mode.
 * - Server-side OAuth2 token authentication, order creation, capture, and verification.
 */

import { prisma } from "@/lib/prisma";

export interface PayPalResolvedConfig {
  enabled: boolean;
  sandboxMode: boolean;
  clientId: string | null;
  clientSecret: string | null;
  appName: string | null;
  apiBaseUrl: string;
  webBaseUrl: string;
}

/**
 * Resolves the currently active PayPal configuration directly from SQLite GlobalSetting.
 */
export async function getPayPalConfig(modeOverride?: boolean): Promise<PayPalResolvedConfig> {
  const settings = await prisma.globalSetting.findUnique({
    where: { id: "singleton" },
    select: {
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

  // If explicit mode override provided, honor it; otherwise read from database (defaults to true)
  let sandboxMode = modeOverride !== undefined ? modeOverride : settings?.paypalSandboxMode !== false;

  // Resilient safeguard: If Live mode is requested but Live keys are missing or placeholders,
  // gracefully fall back to Sandbox mode so the app never crashes with "Client Authentication failed"
  const liveClientId = settings?.paypalLiveClientId?.trim();
  const liveSecret = settings?.paypalLiveClientSecret?.trim();
  const hasLiveKeys =
    Boolean(liveClientId && liveSecret) &&
    !liveClientId?.includes("PLACEHOLDER") &&
    !liveSecret?.includes("PLACEHOLDER");

  if (!sandboxMode && !hasLiveKeys) {
    console.warn(
      "[PayPal] Live mode was active, but Live credentials are empty or placeholders. Falling back to Sandbox mode."
    );
    sandboxMode = true;
  }

  const enabled = Boolean(settings?.paypalEnabled);

  const clientId = sandboxMode
    ? settings?.paypalSandboxClientId || null
    : settings?.paypalLiveClientId || null;

  const clientSecret = sandboxMode
    ? settings?.paypalSandboxClientSecret || null
    : settings?.paypalLiveClientSecret || null;

  const appName = sandboxMode
    ? settings?.paypalSandboxAppId || "WEBAPPTEST"
    : settings?.paypalLiveAppId || "Pinnacle Live";

  const apiBaseUrl = sandboxMode
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";

  const webBaseUrl = sandboxMode
    ? "https://sandbox.paypal.com"
    : "https://www.paypal.com";

  return {
    enabled,
    sandboxMode,
    clientId,
    clientSecret,
    appName,
    apiBaseUrl,
    webBaseUrl,
  };
}

/**
 * Obtains an OAuth2 Bearer Access Token from PayPal REST API.
 */
export async function getPayPalOAuthToken(configOverride?: {
  clientId: string;
  clientSecret: string;
  sandboxMode: boolean;
}): Promise<string> {
  let clientId: string | null = null;
  let clientSecret: string | null = null;
  let apiBaseUrl = "https://api-m.sandbox.paypal.com";
  let activeSandboxMode = true;

  if (configOverride) {
    clientId = configOverride.clientId;
    clientSecret = configOverride.clientSecret;
    activeSandboxMode = configOverride.sandboxMode;
    apiBaseUrl = activeSandboxMode
      ? "https://api-m.sandbox.paypal.com"
      : "https://api-m.paypal.com";
  } else {
    const config = await getPayPalConfig();
    clientId = config.clientId;
    clientSecret = config.clientSecret;
    activeSandboxMode = config.sandboxMode;
    apiBaseUrl = config.apiBaseUrl;
  }

  if (!clientId || !clientSecret) {
    throw new Error(
      `PayPal ${activeSandboxMode ? "Sandbox" : "Live"} Client ID and Secret are not configured in the database.`
    );
  }

  const basicAuth = Buffer.from(`${clientId.trim()}:${clientSecret.trim()}`).toString("base64");

  const response = await fetch(`${apiBaseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();

  if (!response.ok || !data.access_token) {
    const modeLabel = activeSandboxMode ? "Sandbox" : "Live";
    if (data.error === "invalid_client" || data.error_description === "Client Authentication failed") {
      throw new Error(
        `PayPal ${modeLabel} Authentication failed: The Client ID or Secret in the database was rejected by PayPal. Please verify your ${modeLabel} credentials in Admin Settings.`
      );
    }
    const errorMessage =
      data.error_description || data.error || `HTTP ${response.status} failed to obtain PayPal token`;
    throw new Error(errorMessage);
  }

  return data.access_token;
}

/**
 * Tests credentials against PayPal OAuth API to verify validity.
 */
export async function verifyPayPalCredentials(credentials: {
  clientId: string;
  clientSecret: string;
  sandboxMode: boolean;
}): Promise<{
  success: boolean;
  appId?: string;
  scope?: string;
  error?: string;
}> {
  try {
    const apiBaseUrl = credentials.sandboxMode
      ? "https://api-m.sandbox.paypal.com"
      : "https://api-m.paypal.com";

    const basicAuth = Buffer.from(
      `${credentials.clientId.trim()}:${credentials.clientSecret.trim()}`
    ).toString("base64");

    const response = await fetch(`${apiBaseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basicAuth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    const data = await response.json();

    if (!response.ok || !data.access_token) {
      return {
        success: false,
        error: data.error_description || data.error || "Authentication failed with provided credentials",
      };
    }

    return {
      success: true,
      appId: data.app_id,
      scope: data.scope,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Network error connecting to PayPal API",
    };
  }
}

/**
 * Creates a PayPal v2 Checkout Order.
 */
export async function createPayPalOrder(params: {
  totalInCents: number;
  subtotalInCents: number;
  shippingInCents: number;
  taxInCents: number;
  items?: Array<{ name: string; quantity: number; priceInCents: number }>;
  customId?: string;
  returnUrl?: string;
  cancelUrl?: string;
  sandboxMode?: boolean;
}): Promise<{ id: string; status: string; links: any[]; approveUrl: string | null }> {
  const config = await getPayPalConfig(params.sandboxMode);

  if (!config.enabled) {
    throw new Error("PayPal payment gateway is currently disabled in database settings.");
  }

  const accessToken = await getPayPalOAuthToken({
    clientId: config.clientId!,
    clientSecret: config.clientSecret!,
    sandboxMode: config.sandboxMode,
  });

  const totalValue = (params.totalInCents / 100).toFixed(2);
  const subtotalValue = (params.subtotalInCents / 100).toFixed(2);
  const shippingValue = (params.shippingInCents / 100).toFixed(2);
  const taxValue = (params.taxInCents / 100).toFixed(2);

  const purchaseUnit: any = {
    amount: {
      currency_code: "USD",
      value: totalValue,
      breakdown: {
        item_total: {
          currency_code: "USD",
          value: subtotalValue,
        },
        shipping: {
          currency_code: "USD",
          value: shippingValue,
        },
        tax_total: {
          currency_code: "USD",
          value: taxValue,
        },
      },
    },
    description: "Pinnacle Distributing Commercial Order",
  };

  if (params.customId) {
    purchaseUnit.custom_id = params.customId;
  }

  if (params.items && params.items.length > 0) {
    purchaseUnit.items = params.items.map((i) => ({
      name: i.name.slice(0, 127),
      unit_amount: {
        currency_code: "USD",
        value: (i.priceInCents / 100).toFixed(2),
      },
      quantity: String(i.quantity),
      category: "PHYSICAL_GOODS",
    }));
  }

  const applicationContext: any = {
    brand_name: "Pinnacle Distributing",
    landing_page: "NO_PREFERENCE",
    user_action: "PAY_NOW",
  };

  if (params.returnUrl) {
    applicationContext.return_url = params.returnUrl;
  }
  if (params.cancelUrl) {
    applicationContext.cancel_url = params.cancelUrl;
  }

  const response = await fetch(`${config.apiBaseUrl}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [purchaseUnit],
      application_context: applicationContext,
    }),
  });

  const orderData = await response.json();

  if (!response.ok || !orderData.id) {
    console.error("[PayPal API] createOrder error:", orderData);
    const detailMsg = orderData.details?.[0]?.description || orderData.message || "Failed to create PayPal order";
    throw new Error(detailMsg);
  }

  const links = orderData.links || [];
  const approveLink = links.find((l: any) => l.rel === "approve");

  return {
    id: orderData.id,
    status: orderData.status,
    links,
    approveUrl: approveLink ? approveLink.href : null,
  };
}

/**
 * Fetches details of a PayPal v2 order.
 */
export async function getPayPalOrder(orderId: string): Promise<any> {
  const config = await getPayPalConfig();
  const accessToken = await getPayPalOAuthToken();

  const response = await fetch(`${config.apiBaseUrl}/v2/checkout/orders/${orderId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  const orderData = await response.json();
  if (!response.ok) {
    throw new Error(orderData.message || `Failed to fetch PayPal order: ${orderId}`);
  }
  return orderData;
}

/**
 * Captures payment for an approved PayPal v2 order.
 */
export async function capturePayPalPayment(orderId: string): Promise<any> {
  const config = await getPayPalConfig();
  const accessToken = await getPayPalOAuthToken();

  const response = await fetch(`${config.apiBaseUrl}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
    },
  });

  const captureData = await response.json();

  if (!response.ok || (captureData.status !== "COMPLETED" && captureData.status !== "APPROVED")) {
    const issue = captureData.details?.[0]?.issue;
    if (issue === "ORDER_ALREADY_CAPTURED") {
      const order = await getPayPalOrder(orderId);
      if (order.status === "COMPLETED") {
        return order;
      }
    }

    console.error("[PayPal API] capturePayment error:", captureData);
    const detailMsg = captureData.details?.[0]?.description || captureData.message || `PayPal capture failed with status: ${captureData.status}`;
    throw new Error(detailMsg);
  }

  return captureData;
}

