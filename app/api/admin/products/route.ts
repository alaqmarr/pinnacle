import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseUSDToCents } from "@/lib/currency";
import crypto from "crypto";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId") || "";

    const where: any = {};

    if (categoryId && categoryId !== "ALL") {
      where.categoryId = categoryId;
    }

    if (search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { sku: { contains: q } },
        { description: { contains: q } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
      },
    });

    const formatted = products.map((prod) => {
      let imageList: string[] = [];
      try {
        if (prod.images && prod.images.startsWith("[")) {
          imageList = JSON.parse(prod.images);
        } else if (prod.images) {
          imageList = [prod.images];
        }
      } catch {
        imageList = prod.images ? [prod.images] : [];
      }

      return {
        id: prod.id,
        name: prod.name,
        slug: prod.slug,
        sku: prod.sku || "",
        description: prod.description || "",
        price: prod.price, // in cents
        stock: prod.inventory,
        inventory: prod.inventory,
        categoryId: prod.categoryId,
        category: prod.category ? {
          id: prod.category.id,
          name: prod.category.name,
          slug: prod.category.slug,
        } : null,
        image: imageList[0] || "",
        images: imageList,
        originDispatch: prod.originDispatch || null,
        featured: prod.featured,
        createdAt: prod.createdAt.toISOString(),
        updatedAt: prod.updatedAt.toISOString(),
      };
    });

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("[Admin API] Failed to list products:", error);
    return NextResponse.json(
      { error: "Failed to list products", details: error.message },
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

    const { name, slug, sku, price, stock, inventory, description, originDispatch, categoryId, image, images, featured } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (!sku || typeof sku !== "string" || !sku.trim()) {
      return NextResponse.json({ error: "SKU is required" }, { status: 400 });
    }

    const trimmedSku = sku.trim();
    const trimmedOrigin = typeof originDispatch === "string" && originDispatch.trim() ? originDispatch.trim() : null;

    // Check duplicate SKU
    const existingSku = await prisma.product.findUnique({
      where: { sku: trimmedSku },
    });

    if (existingSku) {
      return NextResponse.json(
        { error: "SKU must be unique" },
        { status: 400 }
      );
    }

    let priceInCents = 0;
    if (typeof price === "number") {
      if (price < 0) {
        return NextResponse.json({ error: "Price must be a positive number" }, { status: 400 });
      }
      priceInCents = Math.round(price);
    } else if (typeof price === "string") {
      priceInCents = parseUSDToCents(price);
      if (priceInCents < 0) {
        return NextResponse.json({ error: "Price must be a positive number" }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "Valid price is required" }, { status: 400 });
    }

    const rawStock = stock !== undefined ? stock : inventory;
    const stockCount = Math.max(0, parseInt(rawStock, 10) || 0);

    const trimmedName = name.trim();
    let baseSlug = slug && typeof slug === "string" && slug.trim() 
      ? generateSlug(slug) 
      : generateSlug(trimmedName);
      
    if (!baseSlug) {
      baseSlug = "product-" + crypto.randomUUID().slice(0, 8);
    }

    // Check slug uniqueness; append random string if collided
    let finalSlug = baseSlug;
    while (true) {
      const existingSlug = await prisma.product.findFirst({
        where: {
          OR: [
            { slug: finalSlug },
            { id: finalSlug }
          ]
        }
      });
      if (existingSlug) {
        finalSlug = `${baseSlug}_${Math.floor(1000 + Math.random() * 9000).toString()}`;
      } else {
        break;
      }
    }

    // Verify category if specified
    let validCategoryId: string | null = null;
    if (categoryId && typeof categoryId === "string" && categoryId.trim()) {
      const cat = await prisma.category.findUnique({ where: { id: categoryId.trim() } });
      if (cat) {
        validCategoryId = cat.id;
      }
    }

    // Format images
    let imagesJson = "[]";
    if (Array.isArray(images) && images.length > 0) {
      imagesJson = JSON.stringify(images);
    } else if (image && typeof image === "string" && image.trim()) {
      imagesJson = JSON.stringify([image.trim()]);
    }

    const product = await prisma.product.create({
      data: {
        id: finalSlug,
        name: trimmedName,
        slug: finalSlug,
        sku: trimmedSku,
        description: description && typeof description === "string" ? description.trim() : "",
        originDispatch: trimmedOrigin,
        price: priceInCents,
        inventory: stockCount,
        categoryId: validCategoryId,
        images: imagesJson,
        featured: Boolean(featured),
      },
      include: {
        category: true,
      },
    });

    let imageList: string[] = [];
    try {
      imageList = JSON.parse(product.images);
    } catch {
      imageList = product.images ? [product.images] : [];
    }

    return NextResponse.json(
      {
        success: true,
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          sku: product.sku,
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
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("[Admin API] Failed to create product:", error);
    return NextResponse.json(
      { error: "Failed to create product", details: error.message },
      { status: 500 }
    );
  }
}
