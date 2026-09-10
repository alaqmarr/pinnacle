import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProductsClient from "./ProductsClient";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
      },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  const formattedProducts = products.map((p) => {
    let imageList: string[] = [];
    try {
      if (p.images && p.images.startsWith("[")) {
        imageList = JSON.parse(p.images);
      } else if (p.images) {
        imageList = [p.images];
      }
    } catch {
      imageList = p.images ? [p.images] : [];
    }

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku || "",
      description: p.description || "",
      originDispatch: p.originDispatch || "",
      price: p.price,
      stock: p.inventory,
      inventory: p.inventory,
      categoryId: p.categoryId,
      categoryName: p.category?.name || "Uncategorized",
      image: imageList[0] || "",
      featured: p.featured,
      createdAt: p.createdAt.toISOString(),
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Product Inventory Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage packaging cartons, stretch films, strapping, and janitorial supplies stock.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/admin/products/new"
            className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </Link>
        </div>
      </div>

      {/* Interactive Products Client */}
      <ProductsClient
        initialProducts={formattedProducts}
        categories={categories}
      />
    </div>
  );
}
