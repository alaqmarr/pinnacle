/**
 * app/api/account/addresses/[id]/default/route.ts
 * 
 * Set Address as Default API
 * - PATCH: Designates an address as the user's primary default address (IDOR protected)
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const existing = await prisma.address.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "NotFound", message: "Address not found" },
        { status: 404 }
      );
    }

    // IDOR Protection: Verify ownership
    if (existing.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden", message: "You do not have permission to modify this address" },
        { status: 403 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Unset default on all other addresses
      await tx.address.updateMany({
        where: { userId: session.user.id, isDefault: true },
        data: { isDefault: false },
      });

      // Set target address as default
      return tx.address.update({
        where: { id },
        data: { isDefault: true },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Default address updated.",
      address: updated,
    });
  } catch (error: any) {
    console.error("[Account Addresses Default API] PATCH error:", error);
    return NextResponse.json(
      { error: "InternalServerError", message: error.message || "Failed to set default address" },
      { status: 500 }
    );
  }
}
