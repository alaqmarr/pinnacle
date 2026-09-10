import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EditCategoryForm from "./EditCategoryForm";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
        <Link href="/admin/categories" className="hover:text-slate-900">
          Categories
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-semibold">Edit {category.name}</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <h1 className="text-xl font-bold text-slate-900 mb-6">Edit Category</h1>
        <EditCategoryForm
          category={{
            id: category.id,
            name: category.name,
            slug: category.slug,
            description: category.description || "",
            image: category.image || "",
          }}
        />
      </div>
    </div>
  );
}
