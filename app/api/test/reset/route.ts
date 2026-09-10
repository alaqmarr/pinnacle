import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_GLOBAL_SETTINGS, SETTINGS_SINGLETON_ID } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    // Delete in dependency order
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.cartItem.deleteMany({});
    await prisma.cart.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.contactInquiry.deleteMany({});
    await prisma.address.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.account.deleteMany({});
    await prisma.user.deleteMany({});

    // Reset singleton global settings
    await prisma.globalSetting.upsert({
      where: { id: SETTINGS_SINGLETON_ID },
      create: { ...DEFAULT_GLOBAL_SETTINGS },
      update: { ...DEFAULT_GLOBAL_SETTINGS },
    });

    return NextResponse.json({ success: true, message: "Database reset to clean state" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
