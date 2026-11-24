"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatUSD, parseUSDToCents, centsToDollarString } from "@/lib/currency";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { generateSlug } from "@/lib/slug";
import { ConfirmDeleteDialog } from "@/components/admin/ConfirmDeleteDialog";

export interface ProductItem {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  originDispatch?: string | null;
  price: number; // integer cents
  stock: number;
  inventory: number;
  categoryId: string | null;
  categoryName: string;
  image: string;
  featured: boolean;
  variantCount?: number;
  createdAt?: string;
}

export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
}

export default function ProductsClient({
  initialProducts,
  categories,
}: {
  initialProducts: ProductItem[];
  categories: CategorySummary[];
}) {
  const router = useRouter();
  const [products, setProducts] = useState<ProductItem[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<ProductItem | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<ProductItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const selectAllRef = React.useRef<HTMLInputElement | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    sku: "",
    price: "",
    stock: "0",
    categoryId: "",
    description: "",
    originDispatch: "",
    image: "",
    featured: false,
  });
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered products
  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === "ALL" || p.categoryId === selectedCategory;
    const q = search.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q);

    return matchesCategory && matchesSearch;
  });

  const selectedSet = new Set(selectedIds);
  const allFilteredSelected =
    filteredProducts.length > 0 && filteredProducts.every((p) => selectedSet.has(p.id));
  const someFilteredSelected =
    filteredProducts.some((p) => selectedSet.has(p.id)) && !allFilteredSelected;

  React.useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someFilteredSelected;
    }
  }, [someFilteredSelected]);

  const toggleSelectAllFiltered = () => {
    const filteredIds = filteredProducts.map((p) => p.id);
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
    
    if (!isAddOpen && !editProduct) return;
    
    const delayDebounceFn = setTimeout(async () => {
      const generatedSlug = generateSlug(formData.name);

      if (!generatedSlug) return;

      try {
        const res = await fetch(`/api/admin/check-slug?slug=${generatedSlug}&type=product${editProduct ? `&ignoreId=${editProduct.id}` : ""}`);
        if (res.ok) {
          const { slug } = await res.json();
          setFormData((prev) => ({ ...prev, slug }));
        }
      } catch (err) {
        console.error("Failed to check slug", err);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [formData.name, isAddOpen, editProduct]);

  const handleOpenAdd = () => {
    setFormData({
      name: "",
      slug: "",
      sku: "",
      price: "",
      stock: "0",
      categoryId: categories[0]?.id || "",
      description: "",
      originDispatch: "",
      image: "",
      featured: false,
    });
    setFormError("");
    setIsAddOpen(true);
  };

  const handleOpenEdit = (p: ProductItem) => {
    setFormData({
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      price: centsToDollarString(p.price),
      stock: String(p.stock),
      categoryId: p.categoryId || "",
      description: p.description || "",
      originDispatch: p.originDispatch || "",
      image: p.image || "",
      featured: p.featured,
    });
    setFormError("");
    setEditProduct(p);
  };

  const handleSaveAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name.trim()) {
      setFormError("Product name is required.");
      return;
    }
    if (!formData.sku.trim()) {
      setFormError("SKU is required.");
      return;
    }

    const cents = parseUSDToCents(formData.price);
    if (cents <= 0 && formData.price !== "0") {
      setFormError("Please enter a valid price in USD.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          slug: formData.slug.trim(),
          sku: formData.sku.trim(),
          price: cents,
          stock: parseInt(formData.stock, 10) || 0,
          categoryId: formData.categoryId || null,
          description: formData.description.trim(),
          originDispatch: formData.originDispatch.trim() || null,
          image: formData.image.trim(),
          featured: formData.featured,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create product");
      }

      const newProd = data.product;
      const catObj = categories.find((c) => c.id === newProd.categoryId);

      setProducts((prev) => [
        {
          id: newProd.id,
          name: newProd.name,
          slug: newProd.slug,
          sku: newProd.sku || "",
          description: newProd.description || "",
          originDispatch: newProd.originDispatch || "",
          price: newProd.price,
          stock: newProd.stock ?? newProd.inventory,
          inventory: newProd.inventory ?? newProd.stock,
          categoryId: newProd.categoryId,
          categoryName: catObj?.name || "Uncategorized",
          image: newProd.image || "",
          featured: newProd.featured,
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
    if (!editProduct) return;
    setFormError("");

    if (!formData.name.trim()) {
      setFormError("Product name cannot be empty.");
      return;
    }

    const cents = parseUSDToCents(formData.price);

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/products/${editProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          slug: formData.slug.trim(),
          sku: formData.sku.trim(),
          price: cents,
          stock: parseInt(formData.stock, 10) || 0,
          categoryId: formData.categoryId || null,
          description: formData.description.trim(),
          originDispatch: formData.originDispatch.trim() || null,
          image: formData.image.trim(),
          featured: formData.featured,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update product");
      }

      const updated = data.product;
      const catObj = categories.find((c) => c.id === updated.categoryId);

      setProducts((prev) =>
        prev.map((p) =>
          p.id === editProduct.id
            ? {
                ...p,
                name: updated.name,
                slug: updated.slug,
                sku: updated.sku || "",
                description: updated.description || "",
                originDispatch: updated.originDispatch || "",
                price: updated.price,
                stock: updated.stock ?? updated.inventory,
                inventory: updated.inventory ?? updated.stock,
                categoryId: updated.categoryId,
                categoryName: catObj?.name || "Uncategorized",
                image: updated.image || "",
                featured: updated.featured,
              }
            : p
        )
      );

      setEditProduct(null);
      router.refresh();
    } catch (err: any) {
      setFormError(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingDeleteTargets = isBulkDeleteOpen
    ? products.filter((p) => selectedSet.has(p.id))
    : deleteProduct
      ? [deleteProduct]
      : [];

  const totalVariantsAffected = pendingDeleteTargets.reduce(
    (sum, p) => sum + (p.variantCount ?? 0),
    0
  );

  const handleCloseDeleteDialog = () => {
    setDeleteError(null);
    setDeleteProduct(null);
    setIsBulkDeleteOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (pendingDeleteTargets.length === 0) return;
    setIsSubmitting(true);
    setDeleteError(null);

    try {
      const targetIds = pendingDeleteTargets.map((p) => p.id);

      if (isBulkDeleteOpen) {
        const res = await fetch("/api/admin/products/bulk-delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: targetIds }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to bulk delete products");
        }

        const removedSet = new Set(targetIds);
        setProducts((prev) => prev.filter((p) => !removedSet.has(p.id)));
        setSelectedIds((prev) => prev.filter((id) => !removedSet.has(id)));
        setActionMessage(data.message || `Deleted ${targetIds.length} products.`);
        setIsBulkDeleteOpen(false);
      } else if (deleteProduct) {
        const res = await fetch(`/api/admin/products/${deleteProduct.id}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to delete product");
        }

        setProducts((prev) => prev.filter((p) => p.id !== deleteProduct.id));
        setSelectedIds((prev) => prev.filter((id) => id !== deleteProduct.id));
        setActionMessage(data.message || `Deleted "${deleteProduct.name}".`);
        setDeleteProduct(null);
      }

      router.refresh();
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete selected product(s).");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search, Filter & Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-3 flex-1">
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, SKU, or slug..."
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

          {/* Category Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-56 px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="ALL">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400"
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Quick Add Modal
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
            {!allFilteredSelected && filteredProducts.length > 0 && (
              <button
                type="button"
                onClick={toggleSelectAllFiltered}
                className="font-semibold text-red-700 hover:text-red-900 underline"
              >
                Select all {filteredProducts.length} filtered
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

      {/* Table: Always renders headers with SKU, Price, Stock */}
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
                    disabled={filteredProducts.length === 0}
                    aria-label="Select all visible products"
                    className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-4">Product</th>
                <th className="py-3.5 px-4">SKU</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4">Stock</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 px-4 text-center">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <p className="text-sm font-bold text-slate-900">No products found in inventory catalog.</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      {search || selectedCategory !== "ALL"
                        ? "No products matched your active filters. Try clearing your search query."
                        : "Catalog is currently unseeded. Click 'Add Product' or 'Quick Add Modal' to add items."}
                    </p>
                    <div className="mt-4 flex justify-center space-x-3">
                      {(search || selectedCategory !== "ALL") && (
                        <button
                          onClick={() => {
                            setSearch("");
                            setSelectedCategory("ALL");
                          }}
                          className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                          Clear Filters
                        </button>
                      )}
                      <button
                        onClick={handleOpenAdd}
                        className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition-colors"
                      >
                        + Create First Product
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLowStock = p.stock < 5;
                  const isOutOfStock = p.stock <= 0;

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50/75 transition-colors ${
                        selectedSet.has(p.id) ? "bg-sky-50/50" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4 w-10">
                        <input
                          type="checkbox"
                          checked={selectedSet.has(p.id)}
                          onChange={() => toggleSelectRow(p.id)}
                          aria-label={`Select ${p.name}`}
                          className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                        />
                      </td>
                      {/* Product Name & Visual */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div className="flex items-center space-x-3">
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-10 h-10 rounded-lg object-contain bg-slate-50 border border-slate-200 p-1 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-xs font-bold shrink-0">
                              PKG
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="block truncate max-w-xs">{p.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono text-slate-400 font-normal">
                                /{p.slug}
                              </span>
                              {(p.variantCount ?? 0) > 0 && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                                  {p.variantCount} sizes
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-500 font-medium">
                        {p.sku || "N/A"}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {p.categoryName}
                        </span>
                      </td>

                      {/* Price in USD */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {formatUSD(p.price)}
                      </td>

                      {/* Stock Count */}
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {p.stock} units
                      </td>

                      {/* Status / Low Stock Badge */}
                      <td className="py-3.5 px-4">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            In Stock
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center space-x-2">
                          {/* Direct edit route */}
                          <Link
                            href={`/admin/products/${p.id}/edit`}
                            className="text-xs font-semibold text-sky-600 hover:text-sky-800 hover:underline px-2 py-1 rounded"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="text-xs font-medium text-slate-600 hover:text-slate-900 px-2 py-1 hover:bg-slate-100 rounded"
                            title="Edit via quick modal"
                          >
                            Modal
                          </button>
                          <button
                            onClick={() => {
                              setDeleteError(null);
                              setIsBulkDeleteOpen(false);
                              setDeleteProduct(p);
                            }}
                            className="text-xs font-semibold text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Add New Product</h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAdd} className="mt-4 space-y-4">
              {formError && (
                <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      setFormData({
                        ...formData,
                        name: newName,
                        slug: generateSlug(newName),
                      });
                    }}
                    placeholder="e.g. 200# Kraft Corrugated Box 16x16x16"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Slug (Auto-generated) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="e-g-200-kraft"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    SKU (Unique Item Number) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="BOX-161616-HD"
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Price in USD ($) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="34.50"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Inventory Stock Count
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Category
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="">-- Uncategorized --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Product Image (R2 Upload)
                </label>
                <ImageUploader 
                  currentImage={formData.image} 
                  onUploadSuccess={(url) => setFormData({ ...formData, image: url })} 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Description / Commercial Specs
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Industrial grade packaging box, edge crush test 32 ECT, bundled in packs of 25."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Origin / Dispatch
                </label>
                <input
                  type="text"
                  value={formData.originDispatch}
                  onChange={(e) => setFormData({ ...formData, originDispatch: e.target.value })}
                  placeholder="e.g. Dallas Distribution Center, TX"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="add-featured"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                />
                <label htmlFor="add-featured" className="text-xs font-semibold text-slate-700">
                  Feature this product on the public homepage catalog
                </label>
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
                  className="px-6 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Edit Product</h3>
              <button onClick={() => setEditProduct(null)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
              {formError && (
                <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      setFormData({
                        ...formData,
                        name: newName,
                        slug: generateSlug(newName),
                      });
                    }}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Slug (Auto-generated) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    SKU *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Price in USD ($)
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Category
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  >
                    <option value="">-- Uncategorized --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Product Image (R2 Upload)
                </label>
                <ImageUploader 
                  currentImage={formData.image} 
                  onUploadSuccess={(url) => setFormData({ ...formData, image: url })} 
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
                  Origin / Dispatch
                </label>
                <input
                  type="text"
                  value={formData.originDispatch}
                  onChange={(e) => setFormData({ ...formData, originDispatch: e.target.value })}
                  placeholder="e.g. Dallas Distribution Center, TX"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-featured"
                  checked={formData.featured}
                  onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                  className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                />
                <label htmlFor="edit-featured" className="text-xs font-semibold text-slate-700">
                  Feature this product on homepage catalog
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditProduct(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? "Saving Changes..." : "Update Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / Bulk Delete Safeguard Modal */}
      <ConfirmDeleteDialog
        isOpen={Boolean(deleteProduct || isBulkDeleteOpen)}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleDeleteConfirm}
        title={
          isBulkDeleteOpen
            ? `Bulk Delete ${pendingDeleteTargets.length} Product${pendingDeleteTargets.length === 1 ? "" : "s"}`
            : "Delete Product"
        }
        description={
          isBulkDeleteOpen
            ? `You are about to permanently delete ${pendingDeleteTargets.length} selected product(s) from your catalog. This action cannot be undone.`
            : deleteProduct
              ? `Are you sure you want to permanently delete "${deleteProduct.name}" (SKU: ${deleteProduct.sku || "N/A"})? This action cannot be undone.`
              : ""
        }
        confirmLabel={
          isBulkDeleteOpen
            ? `Delete ${pendingDeleteTargets.length} Product${pendingDeleteTargets.length === 1 ? "" : "s"}`
            : "Delete Product"
        }
        isSubmitting={isSubmitting}
        error={deleteError}
        items={pendingDeleteTargets.map((p) => ({
          id: p.id,
          label: p.name,
          meta: p.sku || `/${p.slug}`,
        }))}
        cascadeSummary={`Removes ${pendingDeleteTargets.length} product(s), ${totalVariantsAffected} size/variant SKU(s), and any matching shopping cart items. Historical order snapshots remain safely preserved.`}
      />
    </div>
  );
}
