import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPayPalOrder } from "@/lib/paypal";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, shippingMethod, sandboxMode } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    // 1. Fetch GlobalSettings to check if PayPal is enabled
    const settings = await prisma.globalSetting.findUnique({
      where: { id: "singleton" },
    });

    if (!settings || !settings.paypalEnabled) {
      return NextResponse.json({ error: "PayPal is not configured or disabled by administrator" }, { status: 500 });
    }

    // 2. Calculate subtotal safely on the server from DB products with item fallback
    let subtotal = 0;
    const productIds = items.map((i: any) => i.productId).filter(Boolean);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));
    const orderItems: Array<{ name: string; quantity: number; priceInCents: number }> = [];

    for (const item of items) {
      const dbProduct = item.productId ? productMap.get(item.productId) : null;
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const priceInCents = dbProduct ? dbProduct.price : Math.max(1, Math.round(Number(item.price) || 100));
      const name = dbProduct ? dbProduct.name : String(item.name || "Commercial Supply Item");

      subtotal += priceInCents * qty;
      orderItems.push({
        name,
        quantity: qty,
        priceInCents,
      });
    }

    // 3. Add Shipping & Tax
    let shippingCost = 0;
    if (shippingMethod) {
      const freightMethod = await prisma.freightMethod.findUnique({
        where: { id: shippingMethod },
      });
      if (freightMethod) {
        shippingCost = freightMethod.cost;
      }
    }

    // Standard fixed tax rate of 8.25% (in cents)
    const tax = Math.round(subtotal * 0.0825);
    const total = subtotal + shippingCost + tax;

    // 4. Determine origin for return and cancel callbacks
    const origin =
      request.headers.get("origin") ||
      (request.headers.get("host") ? `http://${request.headers.get("host")}` : null) ||
      process.env.NEXTAUTH_URL ||
      "http://localhost:3000";

    const returnUrl = `${origin}/checkout/paypal-return`;
    const cancelUrl = `${origin}/checkout`;

    // 5. Create PayPal Order
    const paypalOrder = await createPayPalOrder({
      totalInCents: total,
      subtotalInCents: subtotal,
      shippingInCents: shippingCost,
      taxInCents: tax,
      items: orderItems,
      returnUrl,
      cancelUrl,
      sandboxMode: typeof sandboxMode === "boolean" ? sandboxMode : undefined,
    });

    return NextResponse.json({
      id: paypalOrder.id,
      approveUrl: paypalOrder.approveUrl,
    });
  } catch (error: any) {
    console.error("[PayPal Create Order API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create PayPal order" },
      { status: 500 }
    );
  }
}
