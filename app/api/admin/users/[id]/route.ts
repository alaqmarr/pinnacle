/**
 * app/api/admin/users/[id]/route.ts
 * 
 * Administrative Single User API
 * - GET: Fetch individual user details
 * - PATCH: Update role, allowCredit, allowPickup
 * - DELETE: 405 Method Not Allowed (Zero user deletion policy)
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthSession, UserRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_ROLES: UserRole[] = ["ADMIN", "MARKETING", "CUSTOMER"];

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden", message: "Administrator privileges required" },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const user = await prisma.user.findUnique({
      where: { id },
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
    });

    if (!user) {
      return NextResponse.json(
        { error: "NotFound", message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error: any) {
    console.error("[Admin Users API] GET [id] error:", error);
    return NextResponse.json(
      { error: "InternalServerError", message: error.message || "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session || !session.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden", message: "Administrator privileges required" },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await req.json();
    const { role, allowCredit, allowPickup } = body || {};

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: "NotFound", message: "User not found" },
        { status: 404 }
      );
    }

    const updateData: {
      role?: string;
      allowCredit?: boolean;
      allowPickup?: boolean;
    } = {};

    if (role !== undefined) {
      const normalizedRole = String(role).toUpperCase() as UserRole;
      if (!VALID_ROLES.includes(normalizedRole)) {
        return NextResponse.json(
          { error: "BadRequest", message: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}` },
          { status: 400 }
        );
      }

      // Self-demotion check: If current user is modifying their own role to non-ADMIN
      if (session.user.id === id && normalizedRole !== "ADMIN") {
        const adminCount = await prisma.user.count({
          where: { role: "ADMIN" },
        });
        if (adminCount <= 1) {
          return NextResponse.json(
            { error: "BadRequest", message: "Cannot demote the sole remaining administrator account." },
            { status: 400 }
          );
        }
      }

      updateData.role = normalizedRole;
    }

    if (allowCredit !== undefined) {
      updateData.allowCredit = Boolean(allowCredit);
    }

    if (allowPickup !== undefined) {
      updateData.allowPickup = Boolean(allowPickup);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
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
    });

    return NextResponse.json({ user: updatedUser }, { status: 200 });
  } catch (error: any) {
    console.error("[Admin Users API] PATCH [id] error:", error);
    return NextResponse.json(
      { error: "InternalServerError", message: error.message || "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Method Not Allowed", message: "User deletion is strictly prohibited by security policy." },
    { status: 405, headers: { Allow: "GET, PATCH" } }
  );
}
