"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface AdminHeaderProps {
  onOpenMobileSidebar?: () => void;
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
}

export default function AdminHeader({ onOpenMobileSidebar, user }: AdminHeaderProps) {
  const pathname = usePathname();

  // Helper to format breadcrumb title
  const getSectionTitle = () => {
    if (pathname === "/admin") return user?.role === "MARKETING" ? "Marketing Overview" : "Dashboard Overview";
    if (pathname.startsWith("/admin/products")) return "Product Inventory Management";
    if (pathname.startsWith("/admin/categories")) return "Category Inventory Management";
    if (pathname.startsWith("/admin/orders")) return "Orders & Fulfillment";
    if (pathname.startsWith("/admin/inquiries")) return "Customer Inquiries";
    if (pathname.startsWith("/admin/users")) return "User Management & RBAC";
    if (pathname.startsWith("/admin/marketing")) return "Marketing & Script Injection";
    if (pathname.startsWith("/admin/settings/payments")) return "Stripe Payment Gateway Configuration";
    if (pathname.startsWith("/admin/settings")) return "Global Settings & System";
    return user?.role === "MARKETING" ? "Marketing Portal" : "Admin Portal";
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-200 shadow-xs">
      <div className="flex items-center space-x-3">
        {/* Mobile menu hamburger */}
        <button
          onClick={onOpenMobileSidebar}
          type="button"
          className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg lg:hidden focus:outline-none focus:ring-2 focus:ring-sky-500"
          aria-label="Open sidebar"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Section title & breadcrumb */}
        <div>
          <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
            <Link href="/admin" className="hover:text-slate-900 transition-colors">
              {user?.role === "MARKETING" ? "Marketing" : "Admin"}
            </Link>
            <span>/</span>
            <span className="text-slate-800 font-semibold">{getSectionTitle()}</span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 leading-tight">
            {getSectionTitle()}
          </h1>
        </div>
      </div>

      {/* Right side quick actions */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {user?.role === "MARKETING" ? (
          <Link
            href="/admin/marketing"
            className="inline-flex items-center px-3 py-1.5 text-xs sm:text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
            <span className="hidden sm:inline">Marketing Scripts</span>
            <span className="sm:hidden">Scripts</span>
          </Link>
        ) : (
          <Link
            href="/admin/products/new"
            className="inline-flex items-center px-3 py-1.5 text-xs sm:text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 active:bg-sky-800 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Add New Product</span>
            <span className="sm:hidden">Add</span>
          </Link>
        )}

        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden md:inline-flex items-center px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300/80 rounded-lg transition-colors"
          title="Open public storefront in new tab"
        >
          <svg className="w-3.5 h-3.5 mr-1 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Live Store
        </Link>
      </div>
    </header>
  );
}
