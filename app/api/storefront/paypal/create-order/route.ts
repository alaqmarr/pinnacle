import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createPayPalOrder } from "@/lib/paypal";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, shippingMethod } = body;

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

    // 2. Calculate subtotal safely on the server from DB products
    let subtotal = 0;
    const productIds = items.map((i: any) => i.productId);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));
    const orderItems: Array<{ name: string; quantity: number; priceInCents: number }> = [];

    for (const item of items) {
      const dbProduct = productMap.get(item.productId);
      if (!dbProduct) {
        return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 400 });
      }
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      subtotal += dbProduct.price * qty;
      orderItems.push({
        name: dbProduct.name,
        quantity: qty,
        priceInCents: dbProduct.price,
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

    // 4. Create PayPal Order
    const paypalOrder = await createPayPalOrder({
      totalInCents: total,
      subtotalInCents: subtotal,
      shippingInCents: shippingCost,
      taxInCents: tax,
      items: orderItems,
    });

    return NextResponse.json({ id: paypalOrder.id });
  } catch (error: any) {
    console.error("[PayPal Create Order API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create PayPal order" },
      { status: 500 }
    );
  }
}
