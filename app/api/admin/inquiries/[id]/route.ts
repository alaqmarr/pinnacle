import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const inquiry = await prisma.contactInquiry.findUnique({
      where: { id },
    });

    if (!inquiry) {
      return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
    }

    return NextResponse.json(inquiry);
  } catch (error: any) {
    console.error("[Admin API] Failed to get inquiry:", error);
    return NextResponse.json(
      { error: "Failed to get inquiry", details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleUpdateInquiry(req, params);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleUpdateInquiry(req, params);
}

async function handleUpdateInquiry(
  req: NextRequest,
  paramsPromise: Promise<{ id: string }>
) {
  try {
    const { id } = await paramsPromise;

    const existing = await prisma.contactInquiry.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const updateData: any = {};
    if (body.status !== undefined) {
      updateData.status = String(body.status).toUpperCase();
    }

    const updated = await prisma.contactInquiry.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      inquiry: updated,
    });
  } catch (error: any) {
    console.error("[Admin API] Failed to update inquiry:", error);
    return NextResponse.json(
      { error: "Failed to update inquiry", details: error.message },
      { status: 500 }
    );
  }
}
