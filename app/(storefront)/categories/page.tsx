import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CategoryCard } from "@/components/storefront/CategoryCard";
import { EmptyState } from "@/components/storefront/EmptyState";

export const metadata: Metadata = {
  title: "Product Categories | Pinnacle Distributing",
  description:
    "Explore our complete inventory of industrial packaging materials, corrugated shipping boxes, stretch films, strapping, degreasers, and commercial sanitizers.",
  openGraph: {
    title: "Product Categories | Pinnacle Distributing",
    description:
      "Explore our complete inventory of industrial packaging materials and commercial janitorial supplies.",
  },
};

export const revalidate = 3600;

export default async function CategoriesPage() {
  let categories: any[] = [];
  try {
    categories = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  } catch (err) {
    console.error("[CategoriesPage] Error fetching categories:", err);
  }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-xs text-slate-500 mb-6">
        <Link href="/" className="hover:text-slate-900 transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="font-semibold text-slate-900">Categories</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Product Categories
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-2xl leading-relaxed">
          Select a category to view specific carton sizes, film gauges, chemical formulations, and volume pricing.
        </p>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          icon="box"
          title="No Categories Available"
          description="The catalog has not been initialized with product categories yet. You can create your first category via the admin portal."
          actionText="Create Category in Admin"
          actionHref="/admin/categories"
          secondaryActionText="System Setup (/setup)"
          secondaryActionHref="/setup"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      )}
    </div>
  );
}
