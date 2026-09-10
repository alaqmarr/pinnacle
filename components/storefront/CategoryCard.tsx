import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";

export interface CategoryCardProps {
  category: {
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    image?: string | null;
    _count?: {
      products: number;
    };
  };
}

export function CategoryCard({ category }: CategoryCardProps) {
  const productCount = category._count?.products ?? 0;

  return (
    <Link
      href={`/categories/${category.id}`}
      className="group relative flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-xs transition-all duration-200 hover:shadow-md hover:border-slate-300 overflow-hidden"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 transition-colors group-hover:bg-sky-600 group-hover:text-white">
          {category.image ? (
            <img
              src={category.image}
              alt={category.name}
              className="w-8 h-8 object-contain rounded"
            />
          ) : (
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          )}
        </div>

        <Badge variant="neutral">
          {productCount === 1 ? "1 Item" : `${productCount} Items`}
        </Badge>
      </div>

      <div className="flex-1">
        <h3 className="text-lg font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
          {category.name}
        </h3>
        {category.description && (
          <p className="mt-2 text-xs sm:text-sm text-slate-500 line-clamp-2 leading-relaxed">
            {category.description}
          </p>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-xs font-bold text-sky-600 group-hover:translate-x-1 transition-transform">
        <span>Explore Category</span>
        <svg
          className="ml-1 w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </Link>
  );
}
