/**
 * app/api/admin/users/route.ts
 * 
 * Administrative Users API
 * - GET: List all registered users (sanitized, admin only)
 * - DELETE: 405 Method Not Allowed (Zero user deletion policy)
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden", message: "Administrator privileges required" },
        { status: 403 }
      );
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        allowCredit: true,
        allowPickup: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { orders: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ users }, { status: 200 });
  } catch (error: any) {
    console.error("[Admin Users API] GET error:", error);
    return NextResponse.json(
      { error: "InternalServerError", message: error.message || "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Method Not Allowed", message: "User deletion is strictly prohibited by security policy." },
    { status: 405, headers: { Allow: "GET" } }
  );
}
