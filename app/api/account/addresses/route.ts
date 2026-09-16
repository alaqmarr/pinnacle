/**
 * app/api/account/addresses/route.ts
 * 
 * Customer Saved Addresses API
 * - Authenticated users only (session.user.id)
 * - GET: List all saved addresses for current user
 * - POST: Create new address for current user
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "User account not found" },
        { status: 401 }
      );
    }

    const addresses = await prisma.address.findMany({
      where: { userId: session.user.id },
      orderBy: [
        { isDefault: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({ addresses }, { status: 200 });
  } catch (error: any) {
    console.error("[Account Addresses API] GET error:", error);
    return NextResponse.json(
      { error: "InternalServerError", message: error.message || "Failed to fetch addresses" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "User account not found" },
        { status: 401 }
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
      country = "US",
      phone,
      isDefault,
    } = body || {};

    // Validation
    if (!fullName || !String(fullName).trim()) {
      return NextResponse.json(
        { error: "BadRequest", message: "Full Name is required" },
        { status: 400 }
      );
    }
    if (!addressLine1 || !String(addressLine1).trim()) {
      return NextResponse.json(
        { error: "BadRequest", message: "Street Address is required" },
        { status: 400 }
      );
    }
    if (!city || !String(city).trim()) {
      return NextResponse.json(
        { error: "BadRequest", message: "City is required" },
        { status: 400 }
      );
    }
    if (!state || !String(state).trim()) {
      return NextResponse.json(
        { error: "BadRequest", message: "State is required" },
        { status: 400 }
      );
    }
    if (!postalCode || !String(postalCode).trim()) {
      return NextResponse.json(
        { error: "BadRequest", message: "Postal Code is required" },
        { status: 400 }
      );
    }

    // Check existing address count for this user
    const existingCount = await prisma.address.count({
      where: { userId: session.user.id },
    });

    // Automatically set as default if first address or explicitly marked
    const makeDefault = isDefault === true || existingCount === 0;

    // Use transaction if resetting previous default
    const newAddress = await prisma.$transaction(async (tx) => {
      if (makeDefault) {
        await tx.address.updateMany({
          where: { userId: session.user.id, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.address.create({
        data: {
          userId: session.user.id,
          fullName: String(fullName).trim(),
          company: company ? String(company).trim() : null,
          addressLine1: String(addressLine1).trim(),
          addressLine2: addressLine2 ? String(addressLine2).trim() : null,
          city: String(city).trim(),
          state: String(state).trim(),
          postalCode: String(postalCode).trim(),
          country: country ? String(country).trim() : "US",
          phone: phone ? String(phone).trim() : null,
          isDefault: makeDefault,
        },
      });
    });

    return NextResponse.json({ address: newAddress }, { status: 201 });
  } catch (error: any) {
    console.error("[Account Addresses API] POST error:", error);
    return NextResponse.json(
      { error: "InternalServerError", message: error.message || "Failed to create address" },
      { status: 500 }
    );
  }
}
