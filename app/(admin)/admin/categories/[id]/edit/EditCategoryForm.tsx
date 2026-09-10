"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function EditCategoryForm({
  category,
}: {
  category: {
    id: string;
    name: string;
    slug: string;
    description: string;
    image: string;
  };
}) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: category.name,
    slug: category.slug,
    description: category.description,
    image: category.image,
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Category name cannot be empty.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/categories/${category.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update category");
      }

      router.push("/admin/categories");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to update category");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="p-4 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
          Category Name *
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
          Slug
        </label>
        <input
          type="text"
          value={formData.slug}
          onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
          className="w-full px-3.5 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
          Description
        </label>
        <textarea
          rows={4}
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
          Image URL
        </label>
        <input
          type="url"
          value={formData.image}
          onChange={(e) => setFormData({ ...formData, image: e.target.value })}
          className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
        />
      </div>

      <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
        <Link
          href="/admin/categories"
          className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 rounded-lg transition-colors shadow-sm disabled:opacity-50"
        >
          {submitting ? "Updating..." : "Update Category"}
        </button>
      </div>
    </form>
  );
}
