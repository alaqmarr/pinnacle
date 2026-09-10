import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EditProductForm from "./EditProductForm";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  if (!product) {
    notFound();
  }

  let imageList: string[] = [];
  try {
    if (product.images && product.images.startsWith("[")) {
      imageList = JSON.parse(product.images);
    } else if (product.images) {
      imageList = [product.images];
    }
  } catch {
    imageList = product.images ? [product.images] : [];
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
        <Link href="/admin/products" className="hover:text-slate-900">
          Products
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-semibold">Edit {product.name}</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <h1 className="text-xl font-bold text-slate-900 mb-6">Edit Catalog Product</h1>
        <EditProductForm
          product={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            sku: product.sku || "",
            price: product.price,
            stock: product.inventory,
            categoryId: product.categoryId,
            description: product.description || "",
            image: imageList[0] || "",
            originDispatch: product.originDispatch || "",
            featured: product.featured,
          }}
          categories={categories}
        />
      </div>
    </div>
  );
}
