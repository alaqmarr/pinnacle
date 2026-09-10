"use client";

import React, { useState } from "react";
import { formatUSD } from "@/lib/currency";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function FreightClient({ initialMethods }: { initialMethods: any[] }) {
  const [methods, setMethods] = useState(initialMethods);
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "", cost: 0, active: true });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startEdit = (method: any) => {
    setIsEditing(method.id);
    setFormData({
      name: method.name,
      description: method.description || "",
      cost: method.cost / 100,
      active: method.active,
    });
  };

  const cancelEdit = () => {
    setIsEditing(null);
    setFormData({ name: "", description: "", cost: 0, active: true });
  };

  const handleSave = async (id: string) => {
    try {
      setIsSubmitting(true);
      const isNew = id === "NEW";
      const url = isNew ? "/api/admin/freight-methods" : `/api/admin/freight-methods/${id}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          cost: Math.round(formData.cost * 100),
        }),
      });

      if (!res.ok) throw new Error("Failed to save");
      
      const saved = await res.json();
      
      if (isNew) {
        setMethods([...methods, saved]);
      } else {
        setMethods(methods.map((m) => (m.id === id ? saved : m)));
      }
      
      cancelEdit();
    } catch (err) {
      alert("Error saving freight method");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this freight method?")) return;
    try {
      const res = await fetch(`/api/admin/freight-methods/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      setMethods(methods.filter((m) => m.id !== id));
    } catch (err) {
      alert("Error deleting freight method");
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Method Name</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Description</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">Cost</th>
            <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase">Status</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {methods.map((method) => (
            <tr key={method.id}>
              {isEditing === method.id ? (
                <td colSpan={5} className="px-6 py-4 bg-slate-50">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                    <Input label="Cost ($)" type="number" step="0.01" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })} required />
                    <Input label="Description" className="sm:col-span-2" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" checked={formData.active} onChange={(e) => setFormData({ ...formData, active: e.target.checked })} id={`active-${method.id}`} />
                      <label htmlFor={`active-${method.id}`}>Active</label>
                    </div>
                    <div className="flex justify-end space-x-2 sm:col-span-2">
                      <Button variant="outline" onClick={cancelEdit}>Cancel</Button>
                      <Button variant="primary" isLoading={isSubmitting} onClick={() => handleSave(method.id)}>Save Changes</Button>
                    </div>
                  </div>
                </td>
              ) : (
                <>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">{method.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{method.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-bold">{formatUSD(method.cost)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${method.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                      {method.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <button onClick={() => startEdit(method)} className="text-sky-600 hover:text-sky-900">Edit</button>
                    <button onClick={() => handleDelete(method.id)} className="text-red-600 hover:text-red-900">Delete</button>
                  </td>
                </>
              )}
            </tr>
          ))}

          {/* Add New Row */}
          {isEditing === "NEW" ? (
            <tr>
              <td colSpan={5} className="px-6 py-4 bg-sky-50">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                  <Input label="Cost ($)" type="number" step="0.01" value={formData.cost} onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })} required />
                  <Input label="Description" className="sm:col-span-2" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" checked={formData.active} onChange={(e) => setFormData({ ...formData, active: e.target.checked })} id="active-new" />
                    <label htmlFor="active-new">Active</label>
                  </div>
                  <div className="flex justify-end space-x-2 sm:col-span-2">
                    <Button variant="outline" onClick={cancelEdit}>Cancel</Button>
                    <Button variant="primary" isLoading={isSubmitting} onClick={() => handleSave("NEW")}>Create Method</Button>
                  </div>
                </div>
              </td>
            </tr>
          ) : (
            <tr>
              <td colSpan={5} className="px-6 py-4">
                <Button variant="outline" className="w-full border-dashed" onClick={() => startEdit({ id: "NEW", name: "", description: "", cost: 0, active: true })}>
                  + Add New Freight Method
                </Button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
