import React from "react";
import { prisma } from "@/lib/prisma";
import OrdersClient from "./OrdersClient";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      items: true,
      shippingAddress: true,
      billingAddress: true,
    },
  });

  const formatted = orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone || "",
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    subtotal: order.subtotal,
    tax: order.tax,
    shipping: order.shipping,
    total: order.total,
    notes: order.notes || "",
    shippingAddress: order.shippingAddress ? {
      fullName: order.shippingAddress.fullName,
      company: order.shippingAddress.company || "",
      addressLine1: order.shippingAddress.addressLine1,
      addressLine2: order.shippingAddress.addressLine2 || "",
      city: order.shippingAddress.city,
      state: order.shippingAddress.state,
      postalCode: order.shippingAddress.postalCode,
      phone: order.shippingAddress.phone || "",
    } : null,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      name: item.name,
      sku: item.sku || "",
      price: item.price,
      quantity: item.quantity,
      total: item.total,
    })),
    createdAt: order.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight"
          dangerouslySetInnerHTML={{ __html: "Orders & Freight Fulfillment" }}
        />
        <p className="mt-1 text-sm text-slate-500">
          Review inbound customer shipments, update order statuses, and inspect pallet/parcel line items.
        </p>
      </div>

      <OrdersClient initialOrders={formatted} />
    </div>
  );
}
