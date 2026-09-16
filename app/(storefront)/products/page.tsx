import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getGlobalSettings } from "@/lib/settings";
import { ProductCard } from "@/components/storefront/ProductCard";
import { EmptyState } from "@/components/storefront/EmptyState";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Commercial Products Catalog | Pinnacle Distributing",
  description:
    "Browse our complete wholesale catalog of corrugated boxes, stretch wrap, water-activated tape, industrial degreasers, sanitizers, and facility janitorial supplies.",
  openGraph: {
    title: "Commercial Products Catalog | Pinnacle Distributing",
    description:
      "Direct mill & factory wholesale packaging and janitorial supplies. Same-day regional freight dispatch.",
  },
};

export const dynamic = "force-dynamic";

interface ProductsPageProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    sort?: string;
    inStock?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const resolvedParams = await searchParams;
  const search = resolvedParams.search || "";
  const categoryParam = resolvedParams.category || "";
  const sort = resolvedParams.sort || "newest";
  const inStockOnly = resolvedParams.inStock === "true";

  // Build Prisma query filter
  const where: any = {};

  if (categoryParam) {
    where.OR = [
      { categoryId: categoryParam },
      { category: { slug: categoryParam } },
      { category: { name: { contains: categoryParam } } },
    ];
  }

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
      { sku: { contains: search } },
    ];
  }

  if (inStockOnly) {
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

  let products: any[] = [];
  let categories: any[] = [];
  let totalProductsCount = 0;
  let ecommerceMode = true;

  try {
    const [fetchedProducts, fetchedCategories, count, globalSettings] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
        },
        orderBy,
      }),
      prisma.category.findMany({
        orderBy: { name: "asc" },
        include: {
          _count: {
            select: { products: true },
          },
        },
      }),
      prisma.product.count(),
      getGlobalSettings(),
    ]);

    products = fetchedProducts;
    categories = fetchedCategories;
    totalProductsCount = count;
    ecommerceMode = globalSettings?.ecommerceMode !== false;
  } catch (err) {
    console.error("[ProductsPage] Error fetching catalog:", err);
  }

  const isCatalogCompletelyEmpty = totalProductsCount === 0;

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-xs text-slate-500 mb-6">
        <Link href="/" className="hover:text-slate-900 transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="font-semibold text-slate-900">Products Catalog</span>
        {categoryParam && (
          <>
            <span>/</span>
            <span className="text-slate-400 capitalize">{categoryParam}</span>
          </>
        )}
      </nav>

      {/* Catalog Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Commercial Supplies Catalog
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-3xl leading-relaxed">
          Heavy-duty corrugated boxes, stretch wrap, strapping, industrial degreasers, sanitizers, and facility supplies.
        </p>
      </div>

      {isCatalogCompletelyEmpty ? (
        <EmptyState
          icon="box"
          title="Catalog stocking in progress"
          description="Pinnacle Distributing has zero dummy seed data. Log in to the administrator portal to add products and categories."
          actionText="Add Products in Admin"
          actionHref="/admin/products"
          secondaryActionText="System Setup (/setup)"
          secondaryActionHref="/setup"
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* Left Sidebar Filter Panel */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                Filter Catalog
              </h2>
              {(search || categoryParam || inStockOnly || sort !== "newest") && (
                <Link
                  href="/products"
                  className="text-xs text-red-500 hover:text-red-700 font-medium"
                >
                  Reset All
                </Link>
              )}
            </div>

            {/* Search Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Keyword Search
              </label>
              <form action="/products" method="GET">
                {categoryParam && <input type="hidden" name="category" value={categoryParam} />}
                {sort && <input type="hidden" name="sort" value={sort} />}
                <div className="relative">
                  <input
                    type="search"
                    name="search"
                    defaultValue={search}
                    placeholder="Search SKU or item..."
                    className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:border-sky-500 focus:bg-white"
                  />
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </form>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Categories
              </label>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                <Link
                  href={`/products${search ? `?search=${encodeURIComponent(search)}` : ""}`}
                  className={`block text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                    !categoryParam
                      ? "bg-sky-50 text-sky-700 font-bold border border-sky-200"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  All Categories ({totalProductsCount})
                </Link>

                {categories.map((cat) => {
                  const isSelected = categoryParam === cat.id || categoryParam === cat.slug;
                  return (
                    <Link
                      key={cat.id}
                      href={`/products?category=${encodeURIComponent(cat.slug || cat.id)}${
                        search ? `&search=${encodeURIComponent(search)}` : ""
                      }`}
                      className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg transition-colors ${
                        isSelected
                          ? "bg-sky-50 text-sky-700 font-bold border border-sky-200"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span className="truncate">{cat.name}</span>
                      <span className="text-[10px] text-slate-400 ml-2">
                        {cat._count?.products ?? 0}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* In-Stock Filter Toggle */}
            <div className="pt-4 border-t border-slate-100">
              <Link
                href={`/products?${new URLSearchParams({
                  ...(categoryParam ? { category: categoryParam } : {}),
                  ...(search ? { search } : {}),
                  ...(sort ? { sort } : {}),
                  ...(inStockOnly ? {} : { inStock: "true" }),
                }).toString()}`}
                className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer select-none"
              >
                <input
                  type="checkbox"
                  readOnly
                  checked={inStockOnly}
                  className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                />
                <span className="font-medium">Show In-Stock Only</span>
              </Link>
            </div>
          </div>

          {/* Right Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Toolbar: Count & Sort */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-500 font-medium">
                Showing <strong className="text-slate-900 font-bold">{products.length}</strong> products
                {search && (
                  <span>
                    {" "}
                    for search &quot;<span className="text-slate-900 font-semibold">{search}</span>&quot;
                  </span>
                )}
              </div>

              {/* Sort Dropdown Links */}
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-400 font-medium">Sort:</span>
                <Link
                  href={`/products?${new URLSearchParams({
                    ...(categoryParam ? { category: categoryParam } : {}),
                    ...(search ? { search } : {}),
                    ...(inStockOnly ? { inStock: "true" } : {}),
                    sort: "newest",
                  }).toString()}`}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    sort === "newest"
                      ? "bg-slate-900 text-white font-semibold"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  Newest
                </Link>
                {ecommerceMode && (
                  <>
                    <Link
                      href={`/products?${new URLSearchParams({
                        ...(categoryParam ? { category: categoryParam } : {}),
                        ...(search ? { search } : {}),
                        ...(inStockOnly ? { inStock: "true" } : {}),
                        sort: "price-asc",
                      }).toString()}`}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        sort === "price-asc"
                          ? "bg-slate-900 text-white font-semibold"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      Price: Low-High
                    </Link>
                    <Link
                      href={`/products?${new URLSearchParams({
                        ...(categoryParam ? { category: categoryParam } : {}),
                        ...(search ? { search } : {}),
                        ...(inStockOnly ? { inStock: "true" } : {}),
                        sort: "price-desc",
                      }).toString()}`}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        sort === "price-desc"
                          ? "bg-slate-900 text-white font-semibold"
                          : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      Price: High-Low
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Products Grid or Filter Empty State */}
            {products.length === 0 ? (
              <EmptyState
                icon="search"
                title="No matching products found"
                description="No industrial items matched your filter or search query. Try broadening your keywords or removing active filters."
                actionText="Reset All Filters"
                actionHref="/products"
                secondaryActionText="View All Categories"
                secondaryActionHref="/categories"
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
