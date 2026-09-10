/**
 * app/api/admin/marketing/route.ts
 * 
 * Marketing Script Injection API
 * - Accessible to ADMIN and MARKETING roles
 * - GET: Fetch current headScripts and bodyTopScripts
 * - PUT/POST: Save scripts and trigger revalidation
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "MARKETING") {
      return NextResponse.json(
        { error: "Forbidden", message: "Marketing or Administrator privileges required" },
        { status: 403 }
      );
    }

    const settings = await prisma.globalSetting.findUnique({
      where: { id: "singleton" },
      select: {
        headScripts: true,
        bodyTopScripts: true,
      },
    });

    return NextResponse.json({
      headScripts: settings?.headScripts || null,
      bodyTopScripts: settings?.bodyTopScripts || null,
    });
  } catch (error: any) {
    console.error("[Admin Marketing API] GET error:", error);
    return NextResponse.json(
      { error: "InternalServerError", message: error.message || "Failed to fetch marketing scripts" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized", message: "Authentication required" },
        { status: 401 }
      );
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "MARKETING") {
      return NextResponse.json(
        { error: "Forbidden", message: "Marketing or Administrator privileges required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { headScripts, bodyTopScripts } = body || {};

    const updateData: {
      headScripts?: string | null;
      bodyTopScripts?: string | null;
    } = {};

    if (headScripts !== undefined) {
      updateData.headScripts = headScripts && typeof headScripts === "string" && headScripts.trim() ? headScripts.trim() : null;
    }

    if (bodyTopScripts !== undefined) {
      updateData.bodyTopScripts = bodyTopScripts && typeof bodyTopScripts === "string" && bodyTopScripts.trim() ? bodyTopScripts.trim() : null;
    }

    const updated = await prisma.globalSetting.upsert({
      where: { id: "singleton" },
      update: updateData,
      create: {
        id: "singleton",
        ...updateData,
      },
      select: {
        headScripts: true,
        bodyTopScripts: true,
      },
    });

    // Revalidate storefront layout so injected scripts appear immediately
    try {
      revalidatePath("/", "layout");
    } catch {
      // Ignore in non-edge contexts
    }

    return NextResponse.json({
      success: true,
      message: "Marketing scripts saved and storefront layout cache revalidated.",
      headScripts: updated.headScripts,
      bodyTopScripts: updated.bodyTopScripts,
    });
  } catch (error: any) {
    console.error("[Admin Marketing API] PUT error:", error);
    return NextResponse.json(
      { error: "InternalServerError", message: error.message || "Failed to save marketing scripts" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return PUT(req);
}
