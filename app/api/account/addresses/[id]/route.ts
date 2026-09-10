/**
 * app/api/account/addresses/[id]/route.ts
 * 
 * Customer Single Address API
 * - GET: Fetch individual address (IDOR protected)
 * - PUT: Update address fields (IDOR protected)
 * - DELETE: Remove address and auto-promote new default if needed (IDOR protected)
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
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
    const address = await prisma.address.findUnique({
      where: { id },
    });

    if (!address) {
      return NextResponse.json(
        { error: "NotFound", message: "Address not found" },
        { status: 404 }
      );
    }

    // IDOR Protection: Verify ownership
    if (address.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden", message: "Access denied to requested address" },
        { status: 403 }
      );
    }

    return NextResponse.json({ address }, { status: 200 });
  } catch (error: any) {
    console.error("[Account Addresses API] GET [id] error:", error);
    return NextResponse.json(
      { error: "InternalServerError", message: error.message || "Failed to fetch address" },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const body = await req.json();
    const {
      fullName,
      company,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      phone,
      isDefault,
    } = body || {};

    // Validation: if provided, required fields cannot be empty or whitespace-only
    if (fullName !== undefined && (!fullName || !String(fullName).trim())) {
      return NextResponse.json(
        { error: "BadRequest", message: "Full Name cannot be empty" },
        { status: 400 }
      );
    }
    if (addressLine1 !== undefined && (!addressLine1 || !String(addressLine1).trim())) {
      return NextResponse.json(
        { error: "BadRequest", message: "Street Address cannot be empty" },
        { status: 400 }
      );
    }
    if (city !== undefined && (!city || !String(city).trim())) {
      return NextResponse.json(
        { error: "BadRequest", message: "City cannot be empty" },
        { status: 400 }
      );
    }
    if (state !== undefined && (!state || !String(state).trim())) {
      return NextResponse.json(
        { error: "BadRequest", message: "State cannot be empty" },
        { status: 400 }
      );
    }
    if (postalCode !== undefined && (!postalCode || !String(postalCode).trim())) {
      return NextResponse.json(
        { error: "BadRequest", message: "Postal Code cannot be empty" },
        { status: 400 }
      );
    }

    const updatedAddress = await prisma.$transaction(async (tx) => {
      if (isDefault === true && !existing.isDefault) {
        await tx.address.updateMany({
          where: { userId: session.user.id, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.address.update({
        where: { id },
        data: {
          fullName: fullName !== undefined ? String(fullName).trim() : existing.fullName,
          company: company !== undefined ? (company ? String(company).trim() : null) : existing.company,
          addressLine1: addressLine1 !== undefined ? String(addressLine1).trim() : existing.addressLine1,
          addressLine2: addressLine2 !== undefined ? (addressLine2 ? String(addressLine2).trim() : null) : existing.addressLine2,
          city: city !== undefined ? String(city).trim() : existing.city,
          state: state !== undefined ? String(state).trim() : existing.state,
          postalCode: postalCode !== undefined ? String(postalCode).trim() : existing.postalCode,
          country: country !== undefined ? (country ? String(country).trim() : "US") : existing.country,
          phone: phone !== undefined ? (phone ? String(phone).trim() : null) : existing.phone,
          isDefault: isDefault !== undefined ? Boolean(isDefault) : existing.isDefault,
        },
      });
    });

    return NextResponse.json({ address: updatedAddress }, { status: 200 });
  } catch (error: any) {
    console.error("[Account Addresses API] PUT [id] error:", error);
    return NextResponse.json(
      { error: "InternalServerError", message: error.message || "Failed to update address" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
        { error: "Forbidden", message: "You do not have permission to delete this address" },
        { status: 403 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.address.delete({
        where: { id },
      });

      // If deleted address was default, promote another address to default
      if (existing.isDefault) {
        const remaining = await tx.address.findFirst({
          where: { userId: session.user.id },
          orderBy: { createdAt: "desc" },
        });

        if (remaining) {
          await tx.address.update({
            where: { id: remaining.id },
            data: { isDefault: true },
          });
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: "Address deleted successfully.",
    });
  } catch (error: any) {
    console.error("[Account Addresses API] DELETE [id] error:", error);
    return NextResponse.json(
      { error: "InternalServerError", message: error.message || "Failed to delete address" },
      { status: 500 }
    );
  }
}
