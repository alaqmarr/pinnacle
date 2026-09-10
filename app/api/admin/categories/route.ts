import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    const formatted = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      image: cat.image || "",
      productCount: cat._count.products,
      createdAt: cat.createdAt.toISOString(),
      updatedAt: cat.updatedAt.toISOString(),
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("[Admin API] Failed to fetch categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Empty payload" }, { status: 400 });
    }

    const { name, slug, description, image } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const trimmedName = name.trim();
    const safeSlug = slug && typeof slug === "string" && slug.trim()
      ? generateSlug(slug)
      : generateSlug(trimmedName);

    if (!safeSlug) {
      return NextResponse.json({ error: "Valid category slug is required" }, { status: 400 });
    }

    // Check slug uniqueness
    const existing = await prisma.category.findFirst({
      where: {
        OR: [
          { slug: safeSlug },
          { id: safeSlug }
        ]
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: "Category slug must be unique" },
        { status: 400 }
      );
    }

    const category = await prisma.category.create({
      data: {
        id: safeSlug,
        name: trimmedName,
        slug: safeSlug,
        description: description && typeof description === "string" ? description.trim() : null,
        image: image && typeof image === "string" ? image.trim() : null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description || "",
          image: category.image || "",
          createdAt: category.createdAt.toISOString(),
          updatedAt: category.updatedAt.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[Admin API] Failed to create category:", error);
    return NextResponse.json(
      { error: "Failed to create category", details: error.message },
      { status: 500 }
    );
  }
}
