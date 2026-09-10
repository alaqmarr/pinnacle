import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !(session.user as any).id) {
      // Guest requests return an empty array with 200 OK
      return NextResponse.json({ items: [] });
    }

    const userId = (session.user as any).id;

    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart) {
      return NextResponse.json({ items: [] });
    }

    const formattedItems = cart.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      name: item.product.name,
      slug: item.product.slug,
      price: item.product.price,
      quantity: item.quantity,
      image: item.product.images ? JSON.parse(item.product.images)[0] || null : null,
      sku: item.product.sku,
    }));

    return NextResponse.json({ items: formattedItems });
  } catch (error: any) {
    console.error("[CartAPI] Error fetching cart:", error);
    return NextResponse.json({ items: [] }, { status: 200 });
  }
}
