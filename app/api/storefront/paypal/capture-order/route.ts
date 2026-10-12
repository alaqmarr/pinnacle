import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions, getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { capturePayPalPayment } from "@/lib/paypal";
import { processOrderInventory, US_ZIP_REGEX } from "@/lib/checkout";
import { sendMail, escapeHtml } from "@/lib/mail";
import { formatUSD } from "@/lib/currency";

export async function POST(req: Request) {
  try {
    const session = (await getAuthSession()) || (await getServerSession(authOptions));
    let userId = (session?.user as any)?.id || null;

    if (userId) {
      try {
        const userExists = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true },
        });
        if (!userExists) {
          userId = null;
        }
      } catch {
        userId = null;
      }
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
    }

    const {
      orderID,
      customer,
      shippingAddress,
      shippingMethod,
      items,
      notes,
    } = body;

    if (!orderID) {
      return NextResponse.json({ success: false, error: "Missing PayPal order ID." }, { status: 400 });
    }

    // 0. Check if order was already recorded for this PayPal Order ID (idempotency)
    const existingOrder = await prisma.order.findFirst({
      where: { paypalOrderId: orderID },
      include: { items: true },
    });
    if (existingOrder) {
      return NextResponse.json({
        success: true,
        orderId: existingOrder.id,
        orderNumber: existingOrder.orderNumber,
        order: existingOrder,
      });
    }

    // 1. Verify and Capture payment with PayPal
    let captureResult: any;
    try {
      captureResult = await capturePayPalPayment(orderID);
    } catch (captureErr: any) {
      console.error("[PayPal Capture Error]:", captureErr);
      return NextResponse.json(
        { success: false, error: captureErr.message || "Failed to capture PayPal payment." },
        { status: 400 }
      );
    }

    // Check again if order was created concurrently while capture was executing
    const concurrentOrder = await prisma.order.findFirst({
      where: { paypalOrderId: orderID },
      include: { items: true },
    });
    if (concurrentOrder) {
      return NextResponse.json({
        success: true,
        orderId: concurrentOrder.id,
        orderNumber: concurrentOrder.orderNumber,
        order: concurrentOrder,
      });
    }

    // 2. Validate Cart Items (fallback to user DB cart if needed)
    let cartItems = items;
    if ((!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) && userId) {
      const userCart = await prisma.cart.findUnique({
        where: { userId },
        include: { items: { include: { product: true } } },
      });
      if (userCart && userCart.items.length > 0) {
        cartItems = userCart.items.map((ci) => ({
          productId: ci.productId,
          quantity: ci.quantity,
          name: ci.product.name,
          price: ci.product.price,
        }));
      }
    }

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json(
        { success: false, error: "Cart is empty or expired. Please re-add items." },
        { status: 400 }
      );
    }

    // 3. Validate Shipping Address (fallback to PayPal shipping address if session storage was empty)
    const paypalShipping = captureResult?.purchase_units?.[0]?.shipping;
    const paypalAddress = paypalShipping?.address;
    const paypalPayer = captureResult?.payer;

    const address1 =
      shippingAddress?.address1 ||
      shippingAddress?.addressLine1 ||
      paypalAddress?.address_line_1 ||
      "123 Commercial Parkway";
    const address2 =
      shippingAddress?.address2 ||
      shippingAddress?.addressLine2 ||
      paypalAddress?.address_line_2 ||
      null;
    const city =
      shippingAddress?.city ||
      paypalAddress?.admin_area_2 ||
      "Dallas";
    const state =
      (shippingAddress?.state || paypalAddress?.admin_area_1 || "TX").toUpperCase();
    const rawZip =
      shippingAddress?.zip ||
      shippingAddress?.postalCode ||
      paypalAddress?.postal_code ||
      "75201";

    const recipientName =
      shippingAddress?.name ||
      shippingAddress?.fullName ||
      customer?.fullName ||
      customer?.name ||
      paypalShipping?.name?.full_name ||
      (paypalPayer?.name ? `${paypalPayer.name.given_name || ""} ${paypalPayer.name.surname || ""}`.trim() : "Commercial Purchasing Agent");

    const customerEmail =
      customer?.email ||
      paypalPayer?.email_address ||
      (session?.user as any)?.email ||
      "order@pinnacle.com";

    const trimmedZip = String(rawZip).trim();
    const cleanZip = US_ZIP_REGEX.test(trimmedZip) ? trimmedZip : "75201";

    // 4. Validate Products & Inventory
    let subtotal = 0;
    const validatedItems: Array<{
      productId: string;
      name: string;
      sku: string | null;
      price: number;
      quantity: number;
      total: number;
    }> = [];

    for (const item of cartItems) {
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        return NextResponse.json(
          { success: false, error: `Product with ID ${item.productId} is no longer available.` },
          { status: 400 }
        );
      }

      const priceInCents = product.price;
      const lineTotal = priceInCents * qty;
      subtotal += lineTotal;

      validatedItems.push({
        productId: product.id,
        name: product.name,
        sku: product.sku,
        price: priceInCents,
        quantity: qty,
        total: lineTotal,
      });
    }

    // 5. Calculate Freight and Tax
    let shippingFee = 0;
    if (shippingMethod) {
      const freight = await prisma.freightMethod.findUnique({
        where: { id: shippingMethod },
      });
      if (freight) {
        shippingFee = freight.cost;
      }
    }

    const tax = Math.round(subtotal * 0.0825);
    const total = subtotal + shippingFee + tax;

    // 6. Create Address Record
    const address = await prisma.address.create({
      data: {
        userId: userId || undefined,
        fullName: recipientName.trim(),
        company: customer?.company ? customer.company.trim() : null,
        addressLine1: address1.trim(),
        addressLine2: address2 ? address2.trim() : null,
        city: city.trim(),
        state: state.trim().toUpperCase(),
        postalCode: trimmedZip,
        country: shippingAddress?.country || "US",
        phone: customer?.phone ? customer.phone.trim() : null,
      },
    });

    // 7. Generate Human-Friendly Order Number
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `PIN-${new Date().getFullYear()}-${randomSuffix}`;

    // 8. Persist Order in database
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: userId || undefined,
        customerEmail: customerEmail.trim().toLowerCase(),
        customerName: recipientName.trim(),
        customerPhone: customer?.phone ? customer.phone.trim() : null,
        status: "PENDING",
        paymentStatus: "PAID",
        paymentMethod: "PAYPAL",
        paypalOrderId: orderID,
        currency: "USD",
        subtotal,
        shipping: shippingFee,
        tax,
        total,
        shippingAddressId: address.id,
        billingAddressId: address.id,
        notes: notes ? String(notes).trim() : null,
        items: {
          create: validatedItems.map((i) => ({
            productId: i.productId,
            name: i.name,
            sku: i.sku,
            price: i.price,
            quantity: i.quantity,
            total: i.total,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // 9. Deduct Inventory
    await processOrderInventory(validatedItems, false, {
      decrement: (productId, quantity) =>
        prisma.product.update({
          where: { id: productId },
          data: {
            inventory: {
              decrement: quantity,
            },
          },
        }),
    });

    // 10. Clear User's Cart if authenticated
    if (userId) {
      try {
        const userCart = await prisma.cart.findUnique({ where: { userId } });
        if (userCart) {
          await prisma.cartItem.deleteMany({ where: { cartId: userCart.id } });
        }
      } catch (err) {
        console.warn("[PayPal Capture] Error clearing user cart:", err);
      }
    }

    // 11. Send Confirmation Email
    const safeOrderNum = escapeHtml(order.orderNumber);
    sendMail({
      to: customerEmail.trim(),
      subject: `Order Confirmation: ${order.orderNumber} - Pinnacle Distributing`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #0f172a;">Thank You for Your Order!</h2>
          <p>Your payment via PayPal has been received successfully.</p>
          <p><strong>Order Number:</strong> ${safeOrderNum}</p>
          <p><strong>PayPal Transaction Reference:</strong> ${orderID}</p>
          <p><strong>Subtotal:</strong> ${formatUSD(subtotal)}</p>
          <p><strong>Shipping:</strong> ${formatUSD(shippingFee)}</p>
          <p><strong>Tax:</strong> ${formatUSD(tax)}</p>
          <p><strong>Total:</strong> ${formatUSD(total)}</p>
        </div>
      `,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      order,
    });
  } catch (error: any) {
    console.error("[PayPal Capture Order API] Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process PayPal order." },
      { status: 500 }
    );
  }
}
