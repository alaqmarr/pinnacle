import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, description, cost, active } = body;

    const updated = await prisma.freightMethod.update({
      where: { id },
      data: {
        name,
        description,
        cost: cost !== undefined ? parseInt(cost, 10) : undefined,
        active: active !== undefined ? Boolean(active) : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("[Admin API] Failed to update freight method:", error);
    return NextResponse.json({ error: "Failed to update freight method", details: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.freightMethod.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Admin API] Failed to delete freight method:", error);
    return NextResponse.json({ error: "Failed to delete freight method", details: error.message }, { status: 500 });
  }
}
