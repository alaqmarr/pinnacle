import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const inquiries = await prisma.contactInquiry.findMany({
      orderBy: { createdAt: "desc" },
    });

    const formatted = inquiries.map((inq) => ({
      id: inq.id,
      name: inq.name,
      email: inq.email,
      phone: inq.phone || "",
      message: inq.message,
      status: inq.status,
      createdAt: inq.createdAt.toISOString(),
      updatedAt: inq.updatedAt.toISOString(),
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("[Admin API] Failed to fetch inquiries:", error);
    return NextResponse.json(
      { error: "Failed to fetch inquiries", details: error.message },
      { status: 500 }
    );
  }
}
