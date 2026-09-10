/**
 * app/api/register/route.ts
 * 
 * Customer account registration API endpoint for Pinnacle Distributing.
 * Creates accounts with role CUSTOMER, verifies email uniqueness, and hashes passwords via bcryptjs.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/security";

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      body = await req.json();
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      body = Object.fromEntries(formData.entries());
    } else {
      try {
        body = await req.json();
      } catch {
        body = {};
      }
    }

    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json({ error: "Empty payload" }, { status: 400 });
    }

    const { name, email, password, confirmPassword } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields. Name, email, and password are required." },
        { status: 400 }
      );
    }

    const trimmedEmail = String(email).toLowerCase().trim();
    if (!trimmedEmail.includes("@") || !trimmedEmail.includes(".")) {
      return NextResponse.json(
        { error: "Invalid email address format." },
        { status: 400 }
      );
    }

    if (confirmPassword && password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match." },
        { status: 400 }
      );
    }

    if (String(password).length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters in length." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(String(password));

    const customer = await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: trimmedEmail,
        passwordHash,
        role: "CUSTOMER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        user: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          role: customer.role,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[Register API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to register account" },
      { status: 500 }
    );
  }
}
