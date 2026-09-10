import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in to migrate cart items." },
        { status: 401 }
      );
    }

    const userId = (session.user as any).id;
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const items = body?.items;

    // Reject non-array payloads with 400 Bad Request
    if (!Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: "Malformed payload: items must be an array" },
        { status: 400 }
      );
    }

    // Find or create user's server-side Cart
    let cart = await prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId },
      });
    }

    let migratedCount = 0;

    for (const item of items) {
      if (!item.productId || typeof item.quantity !== "number" || item.quantity <= 0) {
        continue;
      }

      // Verify product exists in database
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) continue;

      // Upsert cart item with increment
      await prisma.cartItem.upsert({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId: item.productId,
          },
        },
        update: {
          quantity: {
            increment: item.quantity,
          },
        },
        create: {
          cartId: cart.id,
          productId: item.productId,
          quantity: item.quantity,
        },
      });

      migratedCount++;
    }

    // Fetch updated cart items with product relation
    const updatedCart = await prisma.cart.findUnique({
      where: { id: cart.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully migrated ${migratedCount} item(s)`,
      cart: updatedCart,
    });
  } catch (error: any) {
    console.error("[CartMigrateAPI] Error during cart migration:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
