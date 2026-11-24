"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { generateSlug } from "@/lib/slug";
import { ConfirmDeleteDialog } from "@/components/admin/ConfirmDeleteDialog";

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  productCount: number;
  createdAt?: string;
}

export default function CategoriesClient({
  initialCategories,
}: {
  initialCategories: CategoryItem[];
}) {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryItem[]>(initialCategories);
  const [search, setSearch] = useState("");

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<CategoryItem | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<CategoryItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [cascadeProducts, setCascadeProducts] = useState(true);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const selectAllRef = React.useRef<HTMLInputElement | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    image: "",
  });
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered categories
  const filteredCategories = categories.filter((c) => {
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q);
  });

  const selectedSet = new Set(selectedIds);
  const allFilteredSelected =
    filteredCategories.length > 0 && filteredCategories.every((c) => selectedSet.has(c.id));
  const someFilteredSelected =
    filteredCategories.some((c) => selectedSet.has(c.id)) && !allFilteredSelected;

  React.useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someFilteredSelected;
    }
  }, [someFilteredSelected]);

  const toggleSelectAllFiltered = () => {
    const filteredIds = filteredCategories.map((c) => c.id);
    if (allFilteredSelected) {
      const filteredSet = new Set(filteredIds);
      setSelectedIds((prev) => prev.filter((id) => !filteredSet.has(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Slug generator effect
  React.useEffect(() => {
    if (!formData.name) return;
    
    // Only auto-generate if adding new, or if slug is empty
    if (!isAddOpen && !editCategory) return;
    
    const delayDebounceFn = setTimeout(async () => {
      const generatedSlug = generateSlug(formData.name);

      if (!generatedSlug) return;

      try {
        const res = await fetch(`/api/admin/check-slug?slug=${generatedSlug}&type=category${editCategory ? `&ignoreId=${editCategory.id}` : ""}`);
        if (res.ok) {
          const { slug } = await res.json();
          setFormData((prev) => ({ ...prev, slug }));
        }
      } catch (err) {
        console.error("Failed to check slug", err);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [formData.name, isAddOpen, editCategory]);

  const handleOpenAdd = () => {
    setFormData({ name: "", slug: "", description: "", image: "" });
    setFormError("");
    setIsAddOpen(true);
  };

  const handleOpenEdit = (cat: CategoryItem) => {
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || "",
      image: cat.image || "",
    });
    setFormError("");
    setEditCategory(cat);
  };

  const handleNameChange = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      name: val,
      slug: generateSlug(val),
    }));
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!formData.name.trim()) {
      setFormError("Category name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create category");
      }

      setCategories((prev) => [
        {
          id: data.category.id,
          name: data.category.name,
          slug: data.category.slug,
          description: data.category.description || "",
          image: data.category.image || "",
          productCount: 0,
        },
        ...prev,
      ]);
      setIsAddOpen(false);
      router.refresh();
    } catch (err: any) {
      setFormError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCategory) return;
    setFormError("");
    if (!formData.name.trim()) {
      setFormError("Category name cannot be empty.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/categories/${editCategory.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update category");
      }

      setCategories((prev) =>
        prev.map((c) =>
          c.id === editCategory.id
            ? {
                ...c,
                name: data.category.name,
                slug: data.category.slug,
                description: data.category.description || "",
                image: data.category.image || "",
              }
            : c
        )
      );
      setEditCategory(null);
      router.refresh();
    } catch (err: any) {
      setFormError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingDeleteTargets = isBulkDeleteOpen
    ? categories.filter((c) => selectedSet.has(c.id))
    : deleteCategory
      ? [deleteCategory]
      : [];

  const totalAffectedProducts = pendingDeleteTargets.reduce(
    (sum, c) => sum + (c.productCount || 0),
    0
  );

  const handleCloseDeleteDialog = () => {
    setDeleteError(null);
    setDeleteCategory(null);
    setIsBulkDeleteOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (pendingDeleteTargets.length === 0) return;
    setIsSubmitting(true);
    setDeleteError(null);
    try {
      const targetIds = pendingDeleteTargets.map((c) => c.id);

      if (isBulkDeleteOpen) {
        const res = await fetch("/api/admin/categories/bulk-delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: targetIds, cascadeProducts }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to bulk delete categories");
        }

        const removedSet = new Set(targetIds);
        setCategories((prev) => prev.filter((c) => !removedSet.has(c.id)));
        setSelectedIds((prev) => prev.filter((id) => !removedSet.has(id)));
        setActionMessage(data.message || `Deleted ${targetIds.length} categories.`);
        setIsBulkDeleteOpen(false);
      } else if (deleteCategory) {
        const res = await fetch(`/api/admin/categories/${deleteCategory.id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cascadeProducts }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to delete category");
        }

        setCategories((prev) => prev.filter((c) => c.id !== deleteCategory.id));
        setSelectedIds((prev) => prev.filter((id) => id !== deleteCategory.id));
        setActionMessage(data.message || `Deleted "${deleteCategory.name}".`);
        setDeleteCategory(null);
      }

      router.refresh();
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete selected category(ies).");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories by name or slug..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          />
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3 top-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Category Modal
        </button>
      </div>

      {/* Feedback Banner */}
      {actionMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl flex items-center justify-between gap-3 text-xs sm:text-sm">
          <span className="font-medium">{actionMessage}</span>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 font-semibold shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Bulk Action Toolbar */}
      {selectedIds.length > 0 && (
        <div className="bg-red-50 border border-red-200 px-4 py-3 rounded-xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs sm:text-sm text-red-900">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-bold bg-red-600 text-white text-xs">
              {selectedIds.length} selected
            </span>
            {!allFilteredSelected && filteredCategories.length > 0 && (
              <button
                type="button"
                onClick={toggleSelectAllFiltered}
                className="font-semibold text-red-700 hover:text-red-900 underline"
              >
                Select all {filteredCategories.length} filtered
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="font-medium text-slate-600 hover:text-slate-900"
            >
              Clear selection
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setDeleteError(null);
              setCascadeProducts(true);
              setIsBulkDeleteOpen(true);
            }}
            className="inline-flex items-center px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs transition-colors"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Selected ({selectedIds.length})
          </button>
        </div>
      )}

      {/* Table / Empty state */}
      {filteredCategories.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-xl shadow-xs">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-slate-900">No categories found.</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Get started by creating your first product category for packaging or janitorial supplies.
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-4 inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors"
          >
            + Create First Category
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 w-10">
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={toggleSelectAllFiltered}
                      disabled={filteredCategories.length === 0}
                      aria-label="Select all visible categories"
                      className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3.5 px-4">Name</th>
                  <th className="py-3.5 px-4">Slug</th>
                  <th className="py-3.5 px-4">Product Count</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCategories.map((c) => (
                  <tr
                    key={c.id}
                    className={`hover:bg-slate-50/75 transition-colors ${
                      selectedSet.has(c.id) ? "bg-sky-50/50" : ""
                    }`}
                  >
                    <td className="py-3.5 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectedSet.has(c.id)}
                        onChange={() => toggleSelectRow(c.id)}
                        aria-label={`Select ${c.name}`}
                        className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                      />
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div className="flex items-center space-x-3">
                        {c.image ? (
                          <img
                            src={c.image}
                            alt={c.name}
                            className="w-8 h-8 rounded object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-xs font-bold">
                            {c.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <span>{c.name}</span>
                          {c.description && (
                            <p className="text-xs text-slate-400 font-normal line-clamp-1">
                              {c.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500">
                      {c.slug}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {c.productCount} products
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center space-x-2">
                        {/* Direct edit route link */}
                        <Link
                          href={`/admin/categories/${c.id}/edit`}
                          className="text-xs font-semibold text-sky-600 hover:text-sky-800 hover:underline px-2 py-1 rounded"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="text-xs font-medium text-slate-600 hover:text-slate-900 px-2 py-1 hover:bg-slate-100 rounded"
                          title="Edit via quick modal"
                        >
                          Modal
                        </button>
                        <button
                          onClick={() => {
                            setDeleteError(null);
                            setCascadeProducts(true);
                            setIsBulkDeleteOpen(false);
                            setDeleteCategory(c);
                          }}
                          className="text-xs font-semibold text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Add New Category</h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="mt-4 space-y-4">
              {formError && (
                <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g. Corrugated Boxes & Cartons"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Slug (URL identifier)
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="corrugated-boxes-cartons"
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Commercial grade packaging boxes, cartons, and corrugated sheets..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Category Image (R2 Upload)
                </label>
                <ImageUploader 
                  currentImage={formData.image} 
                  onUploadSuccess={(url) => setFormData({ ...formData, image: url })} 
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      {editCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Edit Category</h3>
              <button
                onClick={() => setEditCategory(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
              {formError && (
                <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Category Image (R2 Upload)
                </label>
                <ImageUploader 
                  currentImage={formData.image} 
                  onUploadSuccess={(url) => setFormData({ ...formData, image: url })} 
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditCategory(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? "Updating..." : "Update Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / Bulk Delete Confirmation Modal */}
      <ConfirmDeleteDialog
        isOpen={Boolean(deleteCategory || isBulkDeleteOpen)}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title={
          isBulkDeleteOpen
            ? `Bulk Delete ${pendingDeleteTargets.length} Categor${pendingDeleteTargets.length === 1 ? "y" : "ies"}`
            : "Delete Category"
        }
        description={
          isBulkDeleteOpen
            ? `You are about to permanently delete ${pendingDeleteTargets.length} selected category(ies). This action cannot be undone.`
            : deleteCategory
              ? `Are you sure you want to permanently delete "${deleteCategory.name}"? This action cannot be undone.`
              : ""
        }
        confirmLabel={
          isBulkDeleteOpen
            ? `Delete ${pendingDeleteTargets.length} Categor${pendingDeleteTargets.length === 1 ? "y" : "ies"}`
            : "Delete Category"
        }
        isSubmitting={isSubmitting}
        error={deleteError}
        items={pendingDeleteTargets.map((c) => ({
          id: c.id,
          label: c.name,
          meta: `${c.productCount} products`,
        }))}
        cascadeToggle={
          totalAffectedProducts > 0
            ? {
                checked: cascadeProducts,
                onChange: setCascadeProducts,
                label: `Cascade delete all ${totalAffectedProducts} related product${totalAffectedProducts === 1 ? "" : "s"}, variants & cart items`,
                helperText:
                  "Uncheck to keep the products in your catalog as Uncategorized instead of deleting them.",
              }
            : undefined
        }
        cascadeSummary={
          totalAffectedProducts === 0
            ? "Selected category(ies) have no tagged products and will be removed cleanly."
            : cascadeProducts
              ? `All ${totalAffectedProducts} related product(s), their size/variant SKUs, and matching shopping cart items will be permanently deleted. Past order history snapshots remain intact.`
              : `The ${totalAffectedProducts} tagged product(s) will NOT be deleted and will safely move to Uncategorized.`
        }
      />
    </div>
  );
}
