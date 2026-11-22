"use client";

import React from "react";

export interface AdminVariantRow {
  id?: string;
  sku: string;
  legacySku: string;
  size: string;
  style: string;
  price: string; // USD dollar string
  priceUnit: string;
  inventory: string;
  specs: string; // JSON string
}

export function VariantsEditor({
  variants,
  onChange,
}: {
  variants: AdminVariantRow[];
  onChange: (next: AdminVariantRow[]) => void;
}) {
  const handleAddRow = () => {
    onChange([
      ...variants,
      {
        sku: "",
        legacySku: "",
        size: "",
        style: "",
        price: "0.00",
        priceUnit: "Price Per Unit",
        inventory: "100",
        specs: "{}",
      },
    ]);
  };

  const handleUpdateRow = (idx: number, field: keyof AdminVariantRow, val: string) => {
    const next = [...variants];
    next[idx] = { ...next[idx], [field]: val };
    onChange(next);
  };

  const handleRemoveRow = (idx: number) => {
    onChange(variants.filter((_, i) => i !== idx));
  };

  return (
    <div className="border border-slate-200 rounded-xl p-4 sm:p-5 bg-slate-50/70 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Sizes &amp; Variants Matrix ({variants.length})
          </h3>
          <p className="text-xs text-slate-500">
            Optional: Add specific sizes, stock codes, legacy codes, technical specs JSON, and per-variant pricing.
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddRow}
          className="inline-flex items-center px-3 py-1.5 text-xs font-bold text-sky-700 bg-sky-50 border border-sky-200 hover:bg-sky-100 rounded-lg transition-colors shrink-0"
        >
          + Add Size / Variant
        </button>
      </div>

      {variants.length === 0 ? (
        <div className="text-xs text-slate-500 italic py-3 border border-dashed border-slate-300 rounded-lg text-center bg-white">
          No size variants defined — product uses the base SKU and single unit price above.
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                <th className="py-2 px-2.5">SKU / Model *</th>
                <th className="py-2 px-2.5">Legacy Code</th>
                <th className="py-2 px-2.5">Size / Desc *</th>
                <th className="py-2 px-2.5">Style / Grade</th>
                <th className="py-2 px-2.5">Price ($)</th>
                <th className="py-2 px-2.5">Unit</th>
                <th className="py-2 px-2.5">Stock</th>
                <th className="py-2 px-2.5">Specs (JSON)</th>
                <th className="py-2 px-2.5 text-right">Remove</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {variants.map((row, idx) => (
                <tr key={row.id || `new-${idx}`} className="hover:bg-slate-50">
                  <td className="p-2">
                    <input
                      type="text"
                      required
                      value={row.sku}
                      onChange={(e) => handleUpdateRow(idx, "sku", e.target.value)}
                      placeholder="111601"
                      className="w-28 px-2 py-1 border border-slate-300 rounded font-mono text-xs"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={row.legacySku}
                      onChange={(e) => handleUpdateRow(idx, "legacySku", e.target.value)}
                      placeholder="14037515"
                      className="w-28 px-2 py-1 border border-slate-300 rounded font-mono text-xs"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      required
                      value={row.size}
                      onChange={(e) => handleUpdateRow(idx, "size", e.target.value)}
                      placeholder="3/8 x .015 OSC"
                      className="w-40 px-2 py-1 border border-slate-300 rounded text-xs"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={row.style}
                      onChange={(e) => handleUpdateRow(idx, "style", e.target.value)}
                      placeholder="Standard Duty"
                      className="w-32 px-2 py-1 border border-slate-300 rounded text-xs"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={row.price}
                      onChange={(e) => handleUpdateRow(idx, "price", e.target.value)}
                      placeholder="167.66"
                      className="w-20 px-2 py-1 border border-slate-300 rounded font-mono text-xs"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={row.priceUnit}
                      onChange={(e) => handleUpdateRow(idx, "priceUnit", e.target.value)}
                      placeholder="Price/Case"
                      className="w-28 px-2 py-1 border border-slate-300 rounded text-xs"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      min="0"
                      value={row.inventory}
                      onChange={(e) => handleUpdateRow(idx, "inventory", e.target.value)}
                      className="w-16 px-2 py-1 border border-slate-300 rounded font-mono text-xs"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={row.specs}
                      onChange={(e) => handleUpdateRow(idx, "specs", e.target.value)}
                      placeholder='{"Gauge":"0.020"}'
                      className="w-44 px-2 py-1 border border-slate-300 rounded font-mono text-[11px]"
                    />
                  </td>
                  <td className="p-2 text-right">
                    <button
                      type="button"
                      onClick={() => handleRemoveRow(idx)}
                      className="text-red-500 hover:text-red-700 font-semibold px-2 py-1"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
