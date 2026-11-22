import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getStripeClient } from '@/lib/stripe';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { items, shippingMethod } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // 1. Fetch dynamic database-driven Stripe client (Test vs Live mode)
    const { stripe, config } = await getStripeClient();

    // 2. Calculate subtotal safely on the server (including product variants)
    let subtotal = 0;
    const productIds = items.map((i: any) => i.productId).filter(Boolean);
    const variantIds = items.map((i: any) => i.variantId).filter(Boolean);

    const [dbProducts, dbVariants] = await Promise.all([
      prisma.product.findMany({ where: { id: { in: productIds } } }),
      variantIds.length > 0
        ? prisma.productVariant.findMany({ where: { id: { in: variantIds } } })
        : Promise.resolve([]),
    ]);

    const productMap = new Map(dbProducts.map(p => [p.id, p]));
    const variantMap = new Map(dbVariants.map(v => [v.id, v]));

    for (const item of items) {
      const dbProduct = productMap.get(item.productId);
      if (!dbProduct) {
        return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 400 });
      }
      const dbVariant = item.variantId ? variantMap.get(item.variantId) : undefined;
      if (item.variantId && (!dbVariant || dbVariant.productId !== dbProduct.id)) {
        return NextResponse.json({ error: `Product variant not found: ${item.variantId}` }, { status: 400 });
      }
      const unitPrice = dbVariant ? dbVariant.price : dbProduct.price;
      if (unitPrice <= 0) {
        return NextResponse.json({ error: `Item requires a custom commercial quote: ${dbProduct.name}` }, { status: 400 });
      }
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      subtotal += unitPrice * qty;
    }

    // 3. Add Shipping & Tax
    let shippingCost = 0;
    if (shippingMethod) {
      const freightMethod = await prisma.freightMethod.findUnique({
        where: { id: shippingMethod }
      });
      if (freightMethod) {
        shippingCost = freightMethod.cost;
      } else {
        const code = String(shippingMethod).toUpperCase();
        if (code === 'STANDARD_GROUND') shippingCost = 1500;
        else if (code === 'EXPEDITED') shippingCost = 4500;
        else if (code === 'FREIGHT_LTL') shippingCost = 6500;
      }
    }
    
    // Simple fixed tax rate of 8.25% for calculation
    const tax = Math.round(subtotal * 0.0825);
    const total = subtotal + shippingCost + tax;

    // 4. Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: total,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        shippingMethod: shippingMethod || '',
        testMode: config.testMode ? 'true' : 'false',
      }
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      testMode: config.testMode,
    });

  } catch (error: any) {
    console.error('Error creating PaymentIntent:', error);
    return NextResponse.json(
      { error: 'Failed to create PaymentIntent', details: error.message },
      { status: 500 }
    );
  }
}
