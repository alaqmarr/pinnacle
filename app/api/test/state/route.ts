import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getGlobalSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [users, categories, products, orders, contactInquiries, rawGlobalSettings] = await Promise.all([
      prisma.user.findMany({ select: { id: true, email: true, role: true, name: true } }),
      prisma.category.findMany(),
      prisma.product.findMany(),
      prisma.order.findMany({ include: { items: true } }),
      prisma.contactInquiry.findMany(),
      getGlobalSettings(),
    ]);

    return NextResponse.json({
      users,
      categories,
      products: products.map((p) => ({
        ...p,
        stock: p.inventory,
      })),
      orders: orders.map((o) => ({
        ...o,
        shippingFee: o.shipping,
      })),
      contactInquiries: contactInquiries.map((inq) => {
        const match = inq.message ? inq.message.match(/\[Subject:\s*([^\]]+)\]/) : null;
        return {
          ...inq,
          subject: match ? match[1].trim() : "General Inquiry",
        };
      }),
      globalSettings: {
        ...rawGlobalSettings,
        businessHours: rawGlobalSettings.hours,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
