import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import CategoriesClient from "./CategoriesClient";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
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
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Category Inventory Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Create, categorize, and organize packaging and janitorial inventory categories.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/admin/categories/new"
            className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Category
          </Link>
        </div>
      </div>

      {/* Interactive Categories Client Table and Modals */}
      <CategoriesClient initialCategories={formatted} />
    </div>
  );
}
