/**
 * app/api/setup/route.ts
 * 
 * First-time administrator bootstrap API endpoint for Pinnacle Distributing.
 * Strictly gated: rejected with 403 Forbidden if any admin already exists in SQLite.
 * Initializes default GlobalSettings singleton row upon admin creation.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/security";
import { DEFAULT_GLOBAL_SETTINGS, SETTINGS_SINGLETON_ID } from "@/lib/settings";

export async function GET() {
  const adminCount = await prisma.user.count({
    where: { role: "ADMIN" },
  });

  return NextResponse.json({
    setupAvailable: adminCount === 0,
    adminCount,
  });
}

export async function POST(req: NextRequest) {
  try {
    const adminCount = await prisma.user.count({
      where: { role: "ADMIN" },
    });

    if (adminCount > 0) {
      return NextResponse.json(
        { error: "Setup locked. An administrator account already exists." },
        { status: 403 }
      );
    }

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

    const { name, email, password, confirmPassword } = body || {};

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields. Full Name, Email Address, and Password are required." },
        { status: 400 }
      );
    }

    const trimmedEmail = String(email).toLowerCase().trim();
    if (!trimmedEmail.includes("@") || !trimmedEmail.includes(".")) {
      return NextResponse.json(
        { error: "Invalid email format. Please provide a valid email address." },
        { status: 400 }
      );
    }

    if (confirmPassword !== undefined && confirmPassword !== null && password !== confirmPassword) {
      return NextResponse.json(
        { error: "Passwords do not match. Please verify your password confirmation." },
        { status: 400 }
      );
    }

    if (String(password).length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters in length." },
        { status: 400 }
      );
    }

    // Guard against race conditions
    const finalCheck = await prisma.user.count({
      where: { role: "ADMIN" },
    });
    if (finalCheck > 0) {
      return NextResponse.json(
        { error: "Setup locked. An administrator account already exists." },
        { status: 403 }
      );
    }

    const passwordHash = await hashPassword(String(password));

    // Create Admin User
    const adminUser = await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: trimmedEmail,
        passwordHash,
        role: "ADMIN",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Ensure default GlobalSetting singleton row in SQLite
    const existingSettings = await prisma.globalSetting.findUnique({
      where: { id: SETTINGS_SINGLETON_ID },
    });
    if (!existingSettings) {
      await prisma.globalSetting.create({
        data: {
          ...DEFAULT_GLOBAL_SETTINGS,
          id: SETTINGS_SINGLETON_ID,
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Admin account created successfully",
        user: {
          id: adminUser.id,
          name: adminUser.name,
          email: adminUser.email,
          role: adminUser.role,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[Setup API] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to initialize admin account" },
      { status: 500 }
    );
  }
}
