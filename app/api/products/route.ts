import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const featured = searchParams.get("featured");
    const inStock = searchParams.get("inStock");
    const sort = searchParams.get("sort") || "newest";
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "24", 10)));
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (category) {
      where.OR = [
        { categoryId: category },
        { category: { slug: category } },
        { category: { name: { contains: category } } },
      ];
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { sku: { contains: search } },
      ];
    }

    if (featured === "true") {
      where.featured = true;
    }

    if (inStock === "true") {
      where.inventory = { gt: 0 };
    }

    let orderBy: any = { createdAt: "desc" };
    if (sort === "price-asc" || sort === "price_asc") {
      orderBy = { price: "asc" };
    } else if (sort === "price-desc" || sort === "price_desc") {
      orderBy = { price: "desc" };
    } else if (sort === "name-asc" || sort === "name_asc") {
      orderBy = { name: "asc" };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error("[ProductsAPI] Error fetching products:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch products" },
      { status: 500 }
    );
  }
}
