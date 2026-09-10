import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        products: true,
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      image: category.image || "",
      productCount: category._count.products,
      products: category.products,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    });
  } catch (error: any) {
    console.error("[Admin API] Failed to get category:", error);
    return NextResponse.json(
      { error: "Failed to get category", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return updateCategory(req, params);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return updateCategory(req, params);
}

async function updateCategory(
  req: NextRequest,
  paramsPromise: Promise<{ id: string }>
) {
  try {
    const { id } = await paramsPromise;

    const existing = await prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Empty payload" }, { status: 400 });
    }

    if (body.name === "") {
      return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    }

    const updateData: {
      name?: string;
      slug?: string;
      description?: string | null;
      image?: string | null;
    } = {};

    if (typeof body.name === "string" && body.name.trim()) {
      updateData.name = body.name.trim();
    }

    if (typeof body.slug === "string" && body.slug.trim()) {
      const formattedSlug = generateSlug(body.slug);
      // Ensure unique slug if modified
      if (formattedSlug !== existing.slug) {
        const slugExists = await prisma.category.findUnique({
          where: { slug: formattedSlug },
        });
        if (slugExists) {
          return NextResponse.json(
            { error: "Category slug must be unique" },
            { status: 400 }
          );
        }
      }
      updateData.slug = formattedSlug;
    }

    if (body.description !== undefined) {
      updateData.description = typeof body.description === "string" ? body.description.trim() : null;
    }

    if (body.image !== undefined) {
      updateData.image = typeof body.image === "string" ? body.image.trim() : null;
    }

    const updated = await prisma.category.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      category: {
        id: updated.id,
        name: updated.name,
        slug: updated.slug,
        description: updated.description || "",
        image: updated.image || "",
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("[Admin API] Failed to update category:", error);
    return NextResponse.json(
      { error: "Failed to update category", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.category.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Reassign tagged products to null (uncategorized)
    await prisma.product.updateMany({
      where: { categoryId: id },
      data: { categoryId: null },
    });

    // Delete the category
    await prisma.category.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Category deleted. Tagged products are now uncategorized.",
    });
  } catch (error: any) {
    console.error("[Admin API] Failed to delete category:", error);
    return NextResponse.json(
      { error: "Failed to delete category", details: error.message },
      { status: 500 }
    );
  }
}
