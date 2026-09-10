import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const methods = await prisma.freightMethod.findMany({
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(methods);
  } catch (error: any) {
    console.error("[Admin API] Failed to fetch freight methods:", error);
    return NextResponse.json({ error: "Failed to fetch freight methods", details: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, cost, active } = body;

    if (!name || cost === undefined) {
      return NextResponse.json({ error: "Name and cost are required" }, { status: 400 });
    }

    const newMethod = await prisma.freightMethod.create({
      data: {
        name,
        description,
        cost: parseInt(cost, 10),
        active: Boolean(active ?? true),
      },
    });

    return NextResponse.json(newMethod, { status: 201 });
  } catch (error: any) {
    console.error("[Admin API] Failed to create freight method:", error);
    return NextResponse.json({ error: "Failed to create freight method", details: error.message }, { status: 500 });
  }
}
