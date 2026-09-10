import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const methods = await prisma.freightMethod.findMany({
      where: { active: true },
      orderBy: { cost: 'asc' }
    });
    return NextResponse.json(methods);
  } catch (error) {
    console.error("Error fetching freight methods:", error);
    return NextResponse.json({ error: "Failed to fetch freight methods" }, { status: 500 });
  }
}
