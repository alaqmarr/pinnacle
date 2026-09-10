"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";

interface AddressItem {
  id: string;
  fullName: string;
  company: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface OrderItemSummary {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  _count: { items: number };
}

interface UserAccountData {
  id: string;
  name: string | null;
  email: string;
  role: string;
  allowCredit: boolean;
  allowPickup: boolean;
  createdAt: string;
  addresses: AddressItem[];
  orders: OrderItemSummary[];
}

export default function AccountClient({ user }: { user: UserAccountData }) {
  const [activeTab, setActiveTab] = useState<"addresses" | "orders">("addresses");
  const [addresses, setAddresses] = useState<AddressItem[]>(user.addresses);

  // Modal State (Add / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressItem | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [phone, setPhone] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Delete Confirmation State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openAddModal = () => {
    setEditingAddress(null);
    setFullName(user.name || "");
    setCompany("");
    setAddressLine1("");
    setAddressLine2("");
    setCity("");
    setState("");
    setPostalCode("");
    setPhone("");
    setIsDefault(addresses.length === 0);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (addr: AddressItem) => {
    setEditingAddress(addr);
    setFullName(addr.fullName);
    setCompany(addr.company || "");
    setAddressLine1(addr.addressLine1);
    setAddressLine2(addr.addressLine2 || "");
    setCity(addr.city);
    setState(addr.state);
    setPostalCode(addr.postalCode);
    setPhone(addr.phone || "");
    setIsDefault(addr.isDefault);
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (!isSubmitting) {
      setIsModalOpen(false);
      setEditingAddress(null);
      setFormError(null);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        fullName: fullName.trim(),
        company: company.trim() || null,
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2.trim() || null,
        city: city.trim(),
        state: state.trim(),
        postalCode: postalCode.trim(),
        country: "US",
        phone: phone.trim() || null,
        isDefault,
      };

      const url = editingAddress
        ? `/api/account/addresses/${editingAddress.id}`
        : "/api/account/addresses";
      const method = editingAddress ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to save address");
      }

      if (editingAddress) {
        setAddresses((prev) => {
          return prev.map((a) => {
            if (a.id === editingAddress.id) {
              return data.address;
            }
            if (isDefault) {
              return { ...a, isDefault: false };
            }
            return a;
          });
        });
        setFeedback({ type: "success", message: "Address updated successfully." });
      } else {
        setAddresses((prev) => {
          const updated = isDefault ? prev.map((a) => ({ ...a, isDefault: false })) : [...prev];
          return [data.address, ...updated];
        });
        setFeedback({ type: "success", message: "New address saved to your address book." });
      }

      setIsModalOpen(false);
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFormError(err.message || "Error saving address");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetDefault = async (addrId: string) => {
    try {
      const res = await fetch(`/api/account/addresses/${addrId}/default`, {
        method: "PATCH",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to set default address");
      }

      setAddresses((prev) =>
        prev.map((a) => ({
          ...a,
          isDefault: a.id === addrId,
        }))
      );
      setFeedback({ type: "success", message: "Default address updated." });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to update default address." });
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleDeleteAddress = async (addrId: string) => {
    if (!window.confirm("Are you sure you want to delete this address?")) return;

    setDeletingId(addrId);
    try {
      const res = await fetch(`/api/account/addresses/${addrId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to delete address");
      }

      // If deleted was default and there are remaining addresses, the backend promotes the most recent
      const remaining = addresses.filter((a) => a.id !== addrId);
      const wasDefault = addresses.find((a) => a.id === addrId)?.isDefault;
      if (wasDefault && remaining.length > 0) {
        remaining[0].isDefault = true;
      }
      setAddresses(remaining);
      setFeedback({ type: "success", message: "Address deleted successfully." });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to delete address" });
      setTimeout(() => setFeedback(null), 4000);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Account Profile Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-700 text-white font-black text-2xl flex items-center justify-center shadow-md">
              {(user.name || user.email).slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-black text-slate-900">
                  {user.name || "Commercial Customer"}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-300">
                  {user.role}
                </span>
              </div>
              <p className="text-sm text-slate-500 font-mono mt-0.5">{user.email}</p>
              <p className="text-xs text-slate-400 mt-1">
                Account Active Since {new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </p>
            </div>
          </div>

          {/* Wholesale Privileges Status Card */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2 text-xs">
            <div className="font-bold uppercase tracking-wider text-slate-500 text-[10px]">
              Wholesale Account Privileges
            </div>
            <div className="flex flex-col space-y-1.5">
              <div className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${user.allowCredit ? "bg-emerald-500" : "bg-slate-400"}`} />
                <span className="font-semibold text-slate-700">Commercial Credit (Net-30):</span>
                <span className={user.allowCredit ? "text-emerald-700 font-bold" : "text-slate-500"}>
                  {user.allowCredit ? "Authorized" : "Prepayment Required"}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`w-2 h-2 rounded-full ${user.allowPickup ? "bg-blue-500" : "bg-slate-400"}`} />
                <span className="font-semibold text-slate-700">Warehouse Dock Pickup:</span>
                <span className={user.allowPickup ? "text-blue-700 font-bold" : "text-slate-500"}>
                  {user.allowPickup ? "Authorized (Will-Call)" : "Freight Delivery Only"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Toast Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-sm font-semibold flex items-center justify-between shadow-xs ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs underline font-bold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 flex space-x-8">
        <button
          type="button"
          onClick={() => setActiveTab("addresses")}
          className={`pb-4 text-sm font-bold border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === "addresses"
              ? "border-sky-600 text-sky-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Saved Addresses ({addresses.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("orders")}
          className={`pb-4 text-sm font-bold border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === "orders"
              ? "border-sky-600 text-sky-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <span>Recent Orders ({user.orders.length})</span>
        </button>
      </div>

      {/* Tab 1: Saved Addresses */}
      {activeTab === "addresses" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Saved Shipping & Billing Addresses
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage commercial delivery locations and warehouse will-call billing addresses.
              </p>
            </div>
            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center px-4 py-2 text-sm font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm transition-colors"
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add New Address
            </button>
          </div>

          {addresses.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-900">No Saved Addresses</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                You haven&apos;t added any addresses yet. Add your warehouse or shipping dock address for faster checkout.
              </p>
              <button
                type="button"
                onClick={openAddModal}
                className="mt-4 inline-flex items-center px-4 py-2 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors"
              >
                + Add First Address
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`bg-white rounded-2xl border p-6 flex flex-col justify-between shadow-xs transition-all relative ${
                    addr.isDefault
                      ? "border-sky-500 ring-2 ring-sky-500/20"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {/* Default Badge */}
                  {addr.isDefault && (
                    <div className="absolute top-4 right-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                        ✓ Primary Default
                      </span>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <h4 className="text-base font-bold text-slate-900">
                        {addr.fullName}
                      </h4>
                      {addr.company && (
                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                          {addr.company}
                        </p>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 leading-relaxed font-medium">
                      <p>{addr.addressLine1}</p>
                      {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                      <p>
                        {addr.city}, {addr.state} {addr.postalCode}
                      </p>
                      <p className="text-slate-400 uppercase tracking-wider mt-0.5">{addr.country}</p>
                      {addr.phone && (
                        <p className="text-slate-500 mt-1 font-mono">☎ {addr.phone}</p>
                      )}
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      {!addr.isDefault && (
                        <button
                          type="button"
                          onClick={() => handleSetDefault(addr.id)}
                          className="text-xs font-semibold text-sky-600 hover:text-sky-800 hover:underline"
                        >
                          Set as Default
                        </button>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(addr)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteAddress(addr.id)}
                        disabled={deletingId === addr.id}
                        className="px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {deletingId === addr.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Recent Orders */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Order History</h2>
          {user.orders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h3 className="text-base font-bold text-slate-900">No Orders Yet</h3>
              <p className="text-xs text-slate-500 mt-1">
                You haven&apos;t placed any orders yet. Browse our catalog for commercial packaging supplies.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600">
                    <tr>
                      <th scope="col" className="px-6 py-4">Order #</th>
                      <th scope="col" className="px-6 py-4">Date</th>
                      <th scope="col" className="px-6 py-4">Status</th>
                      <th scope="col" className="px-6 py-4">Payment</th>
                      <th scope="col" className="px-6 py-4">Items</th>
                      <th scope="col" className="px-6 py-4 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {user.orders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-slate-900">
                          {ord.orderNumber}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {new Date(ord.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-800">
                            {ord.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                            ord.paymentStatus === "PAID"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}>
                            {ord.paymentStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-600">
                          {ord._count.items} {ord._count.items === 1 ? "item" : "items"}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900">
                          ${(ord.total / 100).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Address Form Modal (Add / Edit) */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingAddress ? "Edit Saved Address" : "Add New Saved Address"}
        description="Enter the recipient and physical address details for shipping and delivery."
        maxWidth="lg"
      >
        <form onSubmit={handleSaveAddress} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-medium">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label htmlFor="address-full-name" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Contact Name *
              </label>
              <input
                id="address-full-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Company */}
            <div>
              <label htmlFor="address-company" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Company / Organization (Optional)
              </label>
              <input
                id="address-company"
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Logistics LLC"
                className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Address Line 1 */}
          <div>
            <label htmlFor="address-line-1" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Street Address *
            </label>
            <input
              id="address-line-1"
              type="text"
              required
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              placeholder="123 Industrial Parkway"
              className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Address Line 2 */}
          <div>
            <label htmlFor="address-line-2" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Suite / Unit / Dock # (Optional)
            </label>
            <input
              id="address-line-2"
              type="text"
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              placeholder="Suite 400 / Dock B"
              className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* City, State, ZIP */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="address-city" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                City *
              </label>
              <input
                id="address-city"
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Dallas"
                className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label htmlFor="address-state" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                State *
              </label>
              <input
                id="address-state"
                type="text"
                required
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="TX"
                maxLength={2}
                className="mt-1 w-full text-sm uppercase border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label htmlFor="address-zip" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Postal Code *
              </label>
              <input
                id="address-zip"
                type="text"
                required
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                placeholder="75201"
                className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="address-phone" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Contact Phone (Optional)
            </label>
            <input
              id="address-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(800) 555-0199"
              className="mt-1 w-full text-sm border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Make Default Checkbox */}
          <div className="pt-2">
            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span className="text-xs font-bold text-slate-800">
                Set as primary default address for checkout
              </span>
            </label>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={closeModal}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving Address...
                </>
              ) : (
                editingAddress ? "Update Address" : "Save Address"
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
