import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatUSD } from "@/lib/currency";
import { ProductDetailClient } from "@/components/storefront/ProductDetailClient";
import { ProductCard } from "@/components/storefront/ProductCard";

export const revalidate = 3600; // 1-hour ISR revalidation

export async function generateStaticParams() {
  const products = await prisma.product.findMany({
    select: { slug: true, id: true },
    take: 100, // Pre-render top 100 products at build time
  });

  return products.map((product) => ({
    id: product.slug || product.id,
  }));
}

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await prisma.product.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
    },
    include: {
      category: true,
    },
  });

  if (!product) {
    return {
      title: "Product Not Found | Pinnacle Distributing",
      description: "The requested product could not be located in our inventory.",
    };
  }

  const title = `${product.name} | Pinnacle Distributing`;
  const description =
    product.description ||
    `Order ${product.name} online from Pinnacle Distributing. Commercial B2B wholesale pricing at ${formatUSD(product.price)}. Fast regional freight.`;

  let parsedImage: string | undefined = undefined;
  if (product.images) {
    try {
      if (product.images.startsWith("[")) {
        const parsed = JSON.parse(product.images);
        if (Array.isArray(parsed) && parsed[0]) parsedImage = parsed[0];
      } else if (product.images.trim()) {
        parsedImage = product.images.trim();
      }
    } catch {}
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: parsedImage ? [{ url: parsedImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: parsedImage ? [parsedImage] : undefined,
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { id } = await params;

  const product = await prisma.product.findFirst({
    where: {
      OR: [{ id }, { slug: id }],
    },
    include: {
      category: true,
    },
  });

  if (!product) {
    return notFound();
  }

  const globalSettings = await prisma.globalSetting.findUnique({
    where: { id: "singleton" },
  });

  // Fetch related products in the same category
  let relatedProducts: any[] = [];
  if (product.categoryId) {
    relatedProducts = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
      },
      take: 4,
      include: {
        category: true,
      },
    });
  }

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-16">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-slate-900 transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href="/products" className="hover:text-slate-900 transition-colors">
          Products
        </Link>
        {product.category && (
          <>
            <span>/</span>
            <Link
              href={`/categories/${product.category.id}`}
              className="hover:text-slate-900 transition-colors"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="font-semibold text-slate-900 truncate max-w-xs sm:max-w-md">
          {product.name}
        </span>
      </nav>

      {/* Main PDP Component */}
      <ProductDetailClient product={product} />

      {/* Industrial Specifications & Compliance Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wider">
            Industrial Specifications & Standards
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Manufacturing metrics, material certifications, and warehouse packaging details.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-xs sm:text-sm">
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="font-medium text-slate-500">Part / SKU:</span>
            <span className="font-mono font-bold text-slate-900">{product.sku || "N/A"}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="font-medium text-slate-500">Classification:</span>
            <span className="font-bold text-slate-900">{product.category?.name || "General Facility Supply"}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="font-medium text-slate-500">Stock Status:</span>
            <span className="font-bold text-slate-900">
              {product.inventory > 0 ? `${product.inventory} Units In Stock` : "Backorder Available"}
            </span>
          </div>
          <div className="flex justify-between py-2.5 border-b border-slate-100 text-xs">
            <span className="font-medium text-slate-500">Origin / Dispatch:</span>
            <span className="font-bold text-slate-900 line-clamp-1 max-w-[200px] sm:max-w-[300px] text-right" title={product.originDispatch || globalSettings?.address || "Warehouse"}>
              {product.originDispatch || globalSettings?.address || "Warehouse"}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="font-medium text-slate-500">Freight Class:</span>
            <span className="font-bold text-slate-900">Class 70 / Standard Industrial Dry</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="font-medium text-slate-500">Pricing Basis:</span>
            <span className="font-bold text-slate-900">Strict USD ({formatUSD(product.price)} / unit)</span>
          </div>
        </div>
      </div>

      {/* Related Products Carousel / Grid */}
      {relatedProducts.length > 0 && (
        <div className="space-y-6 pt-6 border-t border-slate-200">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-sky-600 block mb-1">
              Complementary Supplies
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Related Items in {product.category?.name}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
