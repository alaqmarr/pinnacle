import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import NewProductForm from "./NewProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
        <Link href="/admin/products" className="hover:text-slate-900">
          Products
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-semibold">New Product</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <h1 className="text-xl font-bold text-slate-900 mb-6">Create New Catalog Product</h1>
        <NewProductForm categories={categories} />
      </div>
    </div>
  );
}
