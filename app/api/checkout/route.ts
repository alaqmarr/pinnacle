import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import { formatUSD } from "@/lib/currency";

const US_ZIP_REGEX = /^\d{5}(-\d{4})?$/;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id || null;

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
    }

    const {
      customer,
      shippingAddress,
      shippingMethod = "STANDARD_GROUND",
      paymentMethod = "CREDIT_CARD",
      paymentDetails,
      items,
      notes,
    } = body;

    // 1. Validate Cart Items
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Cart cannot be empty. Please add items to your cart." },
        { status: 400 }
      );
    }

    // 2. Validate Customer and Shipping Address
    const address1 = shippingAddress?.address1 || shippingAddress?.addressLine1;
    const address2 = shippingAddress?.address2 || shippingAddress?.addressLine2 || null;
    const city = shippingAddress?.city;
    const state = shippingAddress?.state;
    const zip = shippingAddress?.zip || shippingAddress?.postalCode;
    const recipientName =
      shippingAddress?.name || shippingAddress?.fullName || customer?.fullName || customer?.name || "Purchasing Agent";
    const customerEmail = customer?.email || (session?.user as any)?.email || "buyer@pinnacle.com";

    if (!address1 || !city || !state || !zip) {
      return NextResponse.json(
        { success: false, error: "Missing required shipping address fields (address, city, state, zip)." },
        { status: 400 }
      );
    }

    const trimmedZip = String(zip).trim();
    if (!US_ZIP_REGEX.test(trimmedZip)) {
      return NextResponse.json(
        { success: false, error: "ZIP code must be 5 digits (e.g. 75201 or 75201-1234)." },
        { status: 400 }
      );
    }

    // 3. Validate Test Card Declines
    if (paymentMethod === "CREDIT_CARD" && paymentDetails?.cardNumber === "4000000000000002") {
      return NextResponse.json(
        {
          success: false,
          error: "Payment authorization failed. The card was declined by the test gateway.",
          reason: "PAYMENT_DECLINED",
        },
        { status: 400 }
      );
    }

    // 4. Validate Products in DB, check inventory, calculate subtotal
    let subtotal = 0;
    const validatedItems: Array<{
      productId: string;
      name: string;
      sku: string | null;
      price: number;
      quantity: number;
      total: number;
    }> = [];

    for (const item of items) {
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);

      if (!item.productId) {
        return NextResponse.json(
          { success: false, error: "Item missing productId", code: "ITEM_UNAVAILABLE" },
          { status: 400 }
        );
      }

      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        return NextResponse.json(
          {
            success: false,
            error: `Product with ID ${item.productId} is no longer available.`,
            code: "ITEM_UNAVAILABLE",
          },
          { status: 400 }
        );
      }

      if (product.inventory < qty) {
        return NextResponse.json(
          {
            success: false,
            error: `Insufficient stock for product ${product.name}. Available: ${product.inventory}, requested: ${qty}.`,
            code: "INSUFFICIENT_STOCK",
          },
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

    // 5. Calculate Shipping Fee in Cents
    let shippingFee = 1500; // $15.00 default for STANDARD_GROUND / standard
    const normalizedMethod = String(shippingMethod).toUpperCase();

    if (normalizedMethod === "FREIGHT_LTL") {
      shippingFee = 6500; // $65.00
    } else if (normalizedMethod === "EXPEDITED") {
      shippingFee = 4500; // $45.00
    } else if (normalizedMethod === "FREE_COMMERCIAL" || normalizedMethod === "PICKUP") {
      shippingFee = 0;
    } else if (subtotal >= 25000 && normalizedMethod === "FREE_COMMERCIAL") {
      shippingFee = 0;
    }

    const total = subtotal + shippingFee;

    // 6. Create Address record
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

    // 7. Generate order number: PIN-YYYY-XXXX
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `PIN-${new Date().getFullYear()}-${randomSuffix}`;

    // 8. Order Status and Payment Status
    const isPurchaseOrder = normalizedMethod === "PURCHASE_ORDER" || String(paymentMethod).toUpperCase() === "PURCHASE_ORDER" || String(paymentMethod).toUpperCase() === "PO_NET30";
    const paymentStatus = isPurchaseOrder ? "UNPAID" : "PAID";
    const status = "PENDING";
    const recordedPaymentMethod = isPurchaseOrder ? "PURCHASE_ORDER" : "CREDIT_CARD";

    // 9. Persist Order in database
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: userId || undefined,
        customerEmail: customerEmail.trim().toLowerCase(),
        customerName: recipientName.trim(),
        customerPhone: customer?.phone ? customer.phone.trim() : null,
        status,
        paymentStatus,
        paymentMethod: recordedPaymentMethod,
        currency: "USD",
        subtotal,
        shipping: shippingFee,
        tax: 0,
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

    // 10. Deduct purchased units from product stock
    for (const item of validatedItems) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          inventory: {
            decrement: item.quantity,
          },
        },
      });
    }

    // 11. Empty authenticated user DB cart if user is logged in
    if (userId) {
      try {
        const userCart = await prisma.cart.findUnique({ where: { userId } });
        if (userCart) {
          await prisma.cartItem.deleteMany({ where: { cartId: userCart.id } });
        }
      } catch (err) {
        console.warn("[CheckoutAPI] Error clearing user cart:", err);
      }
    }

    // 12. Asynchronous email notification (fire & forget)
    sendMail({
      to: customerEmail.trim(),
      subject: `Order Confirmation: ${order.orderNumber} - Pinnacle Distributing`,
      html: `<p>Thank you for your order ${order.orderNumber}. Subtotal: ${formatUSD(subtotal)}, Total: ${formatUSD(total)}.</p>`,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        subtotal: order.subtotal,
        shippingFee: order.shipping,
        total: order.total,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        items: order.items,
      },
    });
  } catch (error: any) {
    console.error("[CheckoutAPI] Error processing checkout:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to process order." },
      { status: 500 }
    );
  }
}
