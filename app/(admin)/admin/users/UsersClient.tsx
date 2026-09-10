"use client";

import React, { useState, useMemo } from "react";
import { Modal } from "@/components/ui/Modal";

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  allowCredit: boolean;
  allowPickup: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    orders: number;
  };
}

interface UsersClientProps {
  initialUsers: AdminUser[];
  currentUserId: string;
}

export default function UsersClient({ initialUsers, currentUserId }: UsersClientProps) {
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [privilegeFilter, setPrivilegeFilter] = useState("ALL");

  // Modal State
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [modalRole, setModalRole] = useState<string>("CUSTOMER");
  const [modalCredit, setModalCredit] = useState<boolean>(false);
  const [modalPickup, setModalPickup] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Metrics
  const metrics = useMemo(() => {
    return {
      total: users.length,
      admins: users.filter((u) => u.role === "ADMIN").length,
      marketers: users.filter((u) => u.role === "MARKETING").length,
      customers: users.filter((u) => u.role === "CUSTOMER").length,
      creditApproved: users.filter((u) => u.allowCredit).length,
    };
  }, [users]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Search
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !query ||
        user.email.toLowerCase().includes(query) ||
        (user.name && user.name.toLowerCase().includes(query));

      // Role Filter
      const matchesRole =
        roleFilter === "ALL" || user.role === roleFilter;

      // Privilege Filter
      let matchesPrivilege = true;
      if (privilegeFilter === "CREDIT") {
        matchesPrivilege = user.allowCredit;
      } else if (privilegeFilter === "PICKUP") {
        matchesPrivilege = user.allowPickup;
      }

      return matchesSearch && matchesRole && matchesPrivilege;
    });
  }, [users, searchQuery, roleFilter, privilegeFilter]);

  const handleOpenEdit = (user: AdminUser) => {
    setEditingUser(user);
    setModalRole(user.role);
    setModalCredit(user.allowCredit);
    setModalPickup(user.allowPickup);
    setSaveError(null);
  };

  const handleCloseModal = () => {
    if (!isSaving) {
      setEditingUser(null);
      setSaveError(null);
    }
  };

  const handleSavePrivileges = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: modalRole,
          allowCredit: modalCredit,
          allowPickup: modalPickup,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to update user privileges");
      }

      // Update local state
      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? { ...u, ...data.user } : u))
      );

      setSuccessMessage(`Updated privileges for ${editingUser.email}`);
      setTimeout(() => setSuccessMessage(null), 4000);
      setEditingUser(null);
    } catch (err: any) {
      setSaveError(err.message || "Network error while updating user");
    } finally {
      setIsSaving(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            ADMIN
          </span>
        );
      case "MARKETING":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-300">
            MARKETING
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            CUSTOMER
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            User Management & RBAC
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage user roles, wholesale Net-30 credit terms, and warehouse dock pickup authorizations.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200">
            <span className="w-2 h-2 mr-1.5 bg-sky-500 rounded-full animate-pulse" />
            Live Database Connected
          </span>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-semibold">{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 font-bold text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Users
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {metrics.total}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-600">
            Administrators
          </div>
          <div className="text-2xl font-black text-amber-700 mt-1">
            {metrics.admins}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-purple-600">
            Marketing
          </div>
          <div className="text-2xl font-black text-purple-700 mt-1">
            {metrics.marketers}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            Customers
          </div>
          <div className="text-2xl font-black text-slate-800 mt-1">
            {metrics.customers}
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs col-span-2 sm:col-span-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
            Credit Approved
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            {metrics.creditApproved}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-50/50"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 text-xs text-slate-600">
            <span className="font-medium">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="text-xs font-semibold border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-800 focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">ADMIN</option>
              <option value="MARKETING">MARKETING</option>
              <option value="CUSTOMER">CUSTOMER</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-600">
            <span className="font-medium">Privilege:</span>
            <select
              value={privilegeFilter}
              onChange={(e) => setPrivilegeFilter(e.target.value)}
              className="text-xs font-semibold border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white text-slate-800 focus:ring-2 focus:ring-sky-500"
            >
              <option value="ALL">All Privileges</option>
              <option value="CREDIT">Net-30 Terms</option>
              <option value="PICKUP">Dock Pickup</option>
            </select>
          </div>

          {(searchQuery || roleFilter !== "ALL" || privilegeFilter !== "ALL") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setRoleFilter("ALL");
                setPrivilegeFilter("ALL");
              }}
              className="text-xs text-sky-600 hover:text-sky-800 font-semibold px-2 py-1"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-4">User</th>
                <th scope="col" className="px-6 py-4">Role</th>
                <th scope="col" className="px-6 py-4">Wholesale Privileges</th>
                <th scope="col" className="px-6 py-4">Orders</th>
                <th scope="col" className="px-6 py-4">Joined</th>
                <th scope="col" className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <p className="text-base font-semibold">No users found</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria or filters.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isCurrent = user.id === currentUserId;
                  const initials = (user.name || user.email)
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* User Avatar + Details */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 text-slate-700 font-bold flex items-center justify-center text-sm uppercase shadow-xs">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 flex items-center space-x-1.5">
                              <span>{user.name || "—"}</span>
                              {isCurrent && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 font-bold uppercase tracking-wider">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 truncate">{user.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-6 py-4">
                        {getRoleBadge(user.role)}
                      </td>

                      {/* Wholesale Privileges */}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {user.allowCredit ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ✓ Net-30 Terms
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-500">
                              Prepay Only
                            </span>
                          )}

                          {user.allowPickup ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                              ✓ Dock Pickup
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-500">
                              Delivery Only
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Orders Count */}
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
                          {user._count.orders} {user._count.orders === 1 ? "order" : "orders"}
                        </span>
                      </td>

                      {/* Joined Date */}
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {new Date(user.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(user)}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500"
                        >
                          <svg className="w-3.5 h-3.5 mr-1.5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Edit Privileges
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Privileges Modal */}
      <Modal
        isOpen={!!editingUser}
        onClose={handleCloseModal}
        title="Edit User Privileges & Role"
        description="Update account role assignments and commercial wholesale privileges."
        maxWidth="md"
      >
        {editingUser && (
          <form onSubmit={handleSavePrivileges} className="space-y-5">
            {saveError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-medium">
                {saveError}
              </div>
            )}

            {/* Read-only User Identity Card */}
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                User Account
              </div>
              <div className="text-sm font-bold text-slate-900">
                {editingUser.name || "(No display name registered)"}
              </div>
              <div className="text-xs text-slate-600 font-mono">
                {editingUser.email}
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-1.5">
              <label htmlFor="user-role-select" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                System Role
              </label>
              <select
                id="user-role-select"
                value={modalRole}
                onChange={(e) => setModalRole(e.target.value)}
                disabled={isSaving}
                className="w-full text-sm font-medium border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="CUSTOMER">CUSTOMER — Storefront buyer & wholesale customer</option>
                <option value="MARKETING">MARKETING — Marketeer with script injection console</option>
                <option value="ADMIN">ADMIN — Full administrator with system controls</option>
              </select>
              <p className="text-[11px] text-slate-500">
                Admins have full operational access. Marketers only access the marketing dashboard.
              </p>
            </div>

            {/* Wholesale Flags */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Commercial Wholesale Privileges
              </div>

              {/* allowCredit toggle */}
              <label className="flex items-start space-x-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50/80 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={modalCredit}
                  onChange={(e) => setModalCredit(e.target.checked)}
                  disabled={isSaving}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 block">
                    Authorize Net-30 Invoicing Terms (`allowCredit`)
                  </span>
                  <span className="text-slate-500 block mt-0.5">
                    Permits the buyer to place orders with deferred commercial invoice billing rather than upfront credit card payment.
                  </span>
                </div>
              </label>

              {/* allowPickup toggle */}
              <label className="flex items-start space-x-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50/80 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={modalPickup}
                  onChange={(e) => setModalPickup(e.target.checked)}
                  disabled={isSaving}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 block">
                    Authorize Warehouse Dock Pickup (`allowPickup`)
                  </span>
                  <span className="text-slate-500 block mt-0.5">
                    Enables the customer to select direct will-call freight dock pickup at our Chatsworth distribution center.
                  </span>
                </div>
              </label>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isSaving}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving Changes...
                  </>
                ) : (
                  "Save Privileges"
                )}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
