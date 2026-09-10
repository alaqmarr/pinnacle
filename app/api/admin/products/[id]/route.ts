import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseUSDToCents } from "@/lib/currency";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    let imageList: string[] = [];
    try {
      imageList = JSON.parse(product.images);
    } catch {
      imageList = product.images ? [product.images] : [];
    }

    return NextResponse.json({
      id: product.id,
      name: product.name,
      slug: product.slug,
      sku: product.sku || "",
      description: product.description || "",
      price: product.price,
      stock: product.inventory,
      inventory: product.inventory,
      categoryId: product.categoryId,
      category: product.category ? {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug,
      } : null,
      image: imageList[0] || "",
      images: imageList,
      originDispatch: product.originDispatch || null,
      featured: product.featured,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    });
  } catch (error: any) {
    console.error("[Admin API] Failed to get product:", error);
    return NextResponse.json(
      { error: "Failed to get product", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return updateProduct(req, params);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return updateProduct(req, params);
}

async function updateProduct(
  req: NextRequest,
  paramsPromise: Promise<{ id: string }>
) {
  try {
    const { id } = await paramsPromise;

    const existing = await prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
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

    const updateData: any = {};

    if (body.name !== undefined) {
      if (typeof body.name === "string" && body.name.trim()) {
        updateData.name = body.name.trim();
      } else if (body.name === "") {
        return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
      }
    }

    if (body.slug !== undefined) {
      if (typeof body.slug === "string" && body.slug.trim()) {
        const trimmedSlug = body.slug.trim();
        if (trimmedSlug !== existing.slug) {
          let testSlug = trimmedSlug;
          while (true) {
            const slugExists = await prisma.product.findFirst({
              where: { slug: testSlug, id: { not: existing.id } },
            });
            if (slugExists) {
              testSlug = `${trimmedSlug}_${Math.floor(1000 + Math.random() * 9000).toString()}`;
            } else {
              break;
            }
          }
          updateData.slug = testSlug;
        }
      }
    }

    if (body.sku !== undefined) {
      if (typeof body.sku === "string" && body.sku.trim()) {
        const trimmedSku = body.sku.trim();
        if (trimmedSku !== existing.sku) {
          const skuExists = await prisma.product.findUnique({
            where: { sku: trimmedSku },
          });
          if (skuExists) {
            return NextResponse.json(
              { error: "SKU must be unique" },
              { status: 400 }
            );
          }
        }
        updateData.sku = trimmedSku;
      }
    }

    if (body.price !== undefined) {
      if (typeof body.price === "number") {
        if (body.price < 0) {
          return NextResponse.json({ error: "Price must be a positive number" }, { status: 400 });
        }
        updateData.price = Math.round(body.price);
      } else if (typeof body.price === "string") {
        const cents = parseUSDToCents(body.price);
        if (cents < 0) {
          return NextResponse.json({ error: "Price must be a positive number" }, { status: 400 });
        }
        updateData.price = cents;
      }
    }

    const rawStock = body.stock !== undefined ? body.stock : body.inventory;
    if (rawStock !== undefined) {
      updateData.inventory = Math.max(0, parseInt(rawStock, 10) || 0);
    }

    if (body.description !== undefined) {
      updateData.description = typeof body.description === "string" ? body.description.trim() : "";
    }

    if (body.originDispatch !== undefined) {
      updateData.originDispatch = typeof body.originDispatch === "string" && body.originDispatch.trim() ? body.originDispatch.trim() : null;
    }

    if (body.categoryId !== undefined) {
      if (body.categoryId === null || body.categoryId === "" || body.categoryId === "NONE") {
        updateData.categoryId = null;
      } else {
        const cat = await prisma.category.findUnique({ where: { id: body.categoryId } });
        if (cat) {
          updateData.categoryId = cat.id;
        } else {
          updateData.categoryId = null;
        }
      }
    }

    if (body.featured !== undefined) {
      updateData.featured = Boolean(body.featured);
    }

    if (body.images !== undefined && Array.isArray(body.images)) {
      updateData.images = JSON.stringify(body.images);
    } else if (body.image !== undefined) {
      updateData.images = typeof body.image === "string" && body.image.trim() 
        ? JSON.stringify([body.image.trim()]) 
        : "[]";
    }

    const updated = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
      },
    });

    let imageList: string[] = [];
    try {
      imageList = JSON.parse(updated.images);
    } catch {
      imageList = updated.images ? [updated.images] : [];
    }

    return NextResponse.json({
      success: true,
      product: {
        id: updated.id,
        name: updated.name,
        slug: updated.slug,
        sku: updated.sku || "",
        description: updated.description || "",
        price: updated.price,
        stock: updated.inventory,
        inventory: updated.inventory,
        categoryId: updated.categoryId,
        category: updated.category ? {
          id: updated.category.id,
          name: updated.category.name,
          slug: updated.category.slug,
        } : null,
        image: imageList[0] || "",
        images: imageList,
        originDispatch: updated.originDispatch || null,
        featured: updated.featured,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("[Admin API] Failed to update product:", error);
    return NextResponse.json(
      { error: "Failed to update product", details: error.message },
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

    const existing = await prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Clean up orphaned cart items
    await prisma.cartItem.deleteMany({
      where: { productId: id },
    });

    // Delete product
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error: any) {
    console.error("[Admin API] Failed to delete product:", error);
    return NextResponse.json(
      { error: "Failed to delete product", details: error.message },
      { status: 500 }
    );
  }
}
