import React from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatUSD } from "@/lib/currency";
import MetricCard from "@/components/admin/MetricCard";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  // Real database queries for dashboard metrics
  const [
    totalProducts,
    totalCategories,
    totalOrders,
    completedOrders,
    contactInquiriesCount,
    recentOrders,
    lowStockProducts,
  ] = await Promise.all([
    prisma.product.count().catch(() => 0),
    prisma.category.count().catch(() => 0),
    prisma.order.count().catch(() => 0),
    prisma.order.findMany({
      where: {
        OR: [
          { status: "DELIVERED" },
          { paymentStatus: "PAID" },
        ],
      },
      select: { total: true },
    }).catch(() => []),
    prisma.contactInquiry.count().catch(() => 0),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        items: true,
      },
    }).catch(() => []),
    prisma.product.findMany({
      where: { inventory: { lte: 10 } },
      take: 5,
      orderBy: { inventory: "asc" },
      include: { category: true },
    }).catch(() => []),
  ]);

  // Calculate total revenue in cents
  const totalRevenueCents = completedOrders.reduce(
    (acc, order) => acc + (order.total || 0),
    0
  );
  const formattedRevenue = formatUSD(totalRevenueCents);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-md border border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30 mb-2">
            Warehouse Ops Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Pinnacle Distributing Overview
          </h1>
          <p className="mt-1 text-sm text-slate-300 max-w-xl">
            Live operations dashboard for packaging and janitorial inventory, freight orders, and commercial customer inquiries.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/admin/products/new"
            className="inline-flex items-center px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow transition-all focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add New Product
          </Link>
          <Link
            href="/admin/categories"
            className="inline-flex items-center px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
          >
            Manage Categories
          </Link>
          <Link
            href="/admin/settings"
            className="inline-flex items-center px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
          >
            System Settings
          </Link>
        </div>
      </div>

      {/* 4 Core Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Total Products"
          value={totalProducts}
          description="Active catalog items in warehouse"
          accentColor="blue"
          href="/admin/products"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
        />

        <MetricCard
          title="Total Categories"
          value={totalCategories}
          description="Packaging & janitorial groups"
          accentColor="slate"
          href="/admin/categories"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
            </svg>
          }
        />

        <MetricCard
          title="Total Orders"
          value={totalOrders}
          description="Customer orders placed to date"
          accentColor="amber"
          href="/admin/orders"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          }
        />

        <MetricCard
          title="Total Revenue"
          value={formattedRevenue}
          description="Calculated from paid/delivered orders"
          accentColor="emerald"
          href="/admin/orders"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Secondary Status Banner: Inquiries */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Commercial Contact Inquiries ({contactInquiriesCount})
            </h3>
            <p className="text-xs text-slate-500">
              Inbound bulk pricing requests and warehouse dispatch inquiries
            </p>
          </div>
        </div>
        <Link
          href="/admin/inquiries"
          className="text-xs font-semibold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-3 py-1.5 rounded-lg transition-colors"
        >
          View Inquiries &rarr;
        </Link>
      </div>

      {/* 2-Column Activity Grid: Recent Orders & Inventory Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Orders (2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Orders</h2>
              <p className="text-xs text-slate-500">Latest customer shipments and statuses</p>
            </div>
            <Link
              href="/admin/orders"
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 transition-colors"
            >
              View All Orders &rarr;
            </Link>
          </div>

          <div className="p-0 flex-1 overflow-x-auto">
            {recentOrders.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-slate-700">No orders placed yet</p>
                <p className="text-xs text-slate-400 mt-1">Customer orders will appear here once submitted.</p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Order #</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Items</th>
                    <th className="py-3 px-4 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentOrders.map((order) => {
                    const statusColor = {
                      PENDING: "bg-amber-50 text-amber-700 border-amber-200",
                      PROCESSING: "bg-blue-50 text-blue-700 border-blue-200",
                      SHIPPED: "bg-indigo-50 text-indigo-700 border-indigo-200",
                      DELIVERED: "bg-emerald-50 text-emerald-700 border-emerald-200",
                      CANCELLED: "bg-red-50 text-red-700 border-red-200",
                    }[order.status] || "bg-slate-100 text-slate-700 border-slate-200";

                    return (
                      <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          <Link href="/admin/orders" className="hover:text-sky-600">
                            {order.orderNumber}
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{order.customerName}</div>
                          <div className="text-[11px] text-slate-400">{order.customerEmail}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${statusColor}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {order.items.reduce((s, i) => s + i.quantity, 0)} units
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-900">
                          {formatUSD(order.total)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Low Stock Alerts (1 Column) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-base font-bold text-slate-900">Low Stock Alerts</h2>
              <p className="text-xs text-slate-500">Items needing replenishment (≤ 10)</p>
            </div>
            <Link
              href="/admin/products"
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 transition-colors"
            >
              Catalog &rarr;
            </Link>
          </div>

          <div className="p-4 flex-1">
            {lowStockProducts.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                <svg className="w-8 h-8 mx-auto mb-2 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                All product inventories are adequately stocked!
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 bg-slate-50/50 flex items-center justify-between"
                  >
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {prod.name}
                      </p>
                      <p className="text-[11px] font-mono text-slate-400">
                        SKU: {prod.sku || "N/A"}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                        prod.inventory < 5
                          ? "bg-red-50 text-red-700 border border-red-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {prod.inventory} left
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
