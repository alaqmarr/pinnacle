import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/storefront/ProductCard";
import { EmptyState } from "@/components/storefront/EmptyState";
import { Badge } from "@/components/ui/Badge";

export const revalidate = 3600; // 1-hour ISR revalidation

export async function generateStaticParams() {
  const categories = await prisma.category.findMany({
    select: { slug: true, id: true },
    take: 50, // Pre-render top 50 categories at build time
  });

  return categories.map((category) => ({
    id: category.slug || category.id,
  }));
}

interface CategoryPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { id } = await params;
  const category = await prisma.category.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
    },
  });

  if (!category) {
    return {
      title: "Category Not Found | Pinnacle Distributing",
      description: "The requested category could not be located in our catalog.",
    };
  }

  const title = `${category.name} | Industrial Packaging & Janitorial Supplies`;
  const description =
    category.description ||
    `Browse commercial ${category.name} available for wholesale dispatch from Pinnacle Distributing.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: category.image ? [{ url: category.image }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function CategoryDetailPage({ params }: CategoryPageProps) {
  const { id } = await params;

  const category = await prisma.category.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
    },
    include: {
      products: {
        orderBy: { createdAt: "desc" },
        include: { category: true },
      },
      _count: {
        select: { products: true },
      },
    },
  });

  if (!category) {
    return notFound();
  }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-xs text-slate-500 mb-6">
        <Link href="/" className="hover:text-slate-900 transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/categories" className="hover:text-slate-900 transition-colors">
          Categories
        </Link>
        <span>/</span>
        <span className="font-semibold text-slate-900">{category.name}</span>
      </nav>

      {/* Category Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 mb-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {category.name}
              </h1>
              <Badge variant="category">
                {category.products.length} {category.products.length === 1 ? "Product" : "Products"}
              </Badge>
            </div>
            {category.description && (
              <p className="mt-2 text-sm text-slate-600 max-w-3xl leading-relaxed">
                {category.description}
              </p>
            )}
          </div>

          <Link
            href="/products"
            className="text-xs font-bold text-sky-600 hover:text-sky-700 whitespace-nowrap"
          >
            ← Back to All Products
          </Link>
        </div>
      </div>

      {/* Tagged Products Grid or Empty State */}
      {category.products.length === 0 ? (
        <EmptyState
          icon="search"
          title="No products found in this category"
          description="There are currently no items cataloged under this category. Check back soon or view our complete product inventory."
          actionText="Browse All Products"
          actionHref="/products"
          secondaryActionText="View Other Categories"
          secondaryActionHref="/categories"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {category.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
