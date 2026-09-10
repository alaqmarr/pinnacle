"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
}

interface NavItem {
  label: string;
  href: string;
  allowedRoles: Array<"ADMIN" | "MARKETING">;
  exact?: boolean;
  icon: (active: boolean) => React.ReactNode;
}

export default function AdminSidebar({
  mobileOpen = false,
  onCloseMobile,
  user,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const userRole = (user?.role || "CUSTOMER").toUpperCase();
  const isMarketing = userRole === "MARKETING";

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/admin",
      allowedRoles: ["ADMIN", "MARKETING"],
      exact: true,
      icon: (active) => (
        <svg
          className={`w-5 h-5 mr-3 transition-colors ${active ? "text-sky-400" : "text-slate-400 group-hover:text-slate-200"}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
        </svg>
      ),
    },
    {
      label: "Products",
      href: "/admin/products",
      allowedRoles: ["ADMIN"],
      icon: (active) => (
        <svg
          className={`w-5 h-5 mr-3 transition-colors ${active ? "text-sky-400" : "text-slate-400 group-hover:text-slate-200"}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      label: "Categories",
      href: "/admin/categories",
      allowedRoles: ["ADMIN"],
      icon: (active) => (
        <svg
          className={`w-5 h-5 mr-3 transition-colors ${active ? "text-sky-400" : "text-slate-400 group-hover:text-slate-200"}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
        </svg>
      ),
    },
    {
      label: "Orders",
      href: "/admin/orders",
      allowedRoles: ["ADMIN"],
      icon: (active) => (
        <svg
          className={`w-5 h-5 mr-3 transition-colors ${active ? "text-sky-400" : "text-slate-400 group-hover:text-slate-200"}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      ),
    },
    {
      label: "Inquiries",
      href: "/admin/inquiries",
      allowedRoles: ["ADMIN"],
      icon: (active) => (
        <svg
          className={`w-5 h-5 mr-3 transition-colors ${active ? "text-sky-400" : "text-slate-400 group-hover:text-slate-200"}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      label: "Users",
      href: "/admin/users",
      allowedRoles: ["ADMIN"],
      icon: (active) => (
        <svg
          className={`w-5 h-5 mr-3 transition-colors ${active ? "text-sky-400" : "text-slate-400 group-hover:text-slate-200"}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      label: "Marketing",
      href: "/admin/marketing",
      allowedRoles: ["ADMIN", "MARKETING"],
      icon: (active) => (
        <svg
          className={`w-5 h-5 mr-3 transition-colors ${active ? "text-sky-400" : "text-slate-400 group-hover:text-slate-200"}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
      ),
    },
    {
      label: "Global Settings",
      href: "/admin/settings",
      allowedRoles: ["ADMIN"],
      exact: true,
      icon: (active) => (
        <svg
          className={`w-5 h-5 mr-3 transition-colors ${active ? "text-sky-400" : "text-slate-400 group-hover:text-slate-200"}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      label: "Stripe Credentials",
      href: "/admin/settings/payments",
      allowedRoles: ["ADMIN"],
      icon: (active) => (
        <svg
          className={`w-5 h-5 mr-3 transition-colors ${active ? "text-sky-400" : "text-slate-400 group-hover:text-slate-200"}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    {
      label: "Freight Methods",
      href: "/admin/settings/freight",
      allowedRoles: ["ADMIN"],
      icon: (active) => (
        <svg
          className={`w-5 h-5 mr-3 transition-colors ${active ? "text-sky-400" : "text-slate-400 group-hover:text-slate-200"}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
    },
  ];

  const visibleNavItems = navItems.filter((item) =>
    item.allowedRoles.includes(userRole as any)
  );

  const adminName = user?.name || (isMarketing ? "Marketing Specialist" : "Operations Admin");
  const adminEmail = user?.email || (isMarketing ? "marketing@pinnacledistributing.com" : "admin@pinnacledistributing.com");
  const initials = adminName.slice(0, 2).toUpperCase();

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: "/login" });
    } catch {
      window.location.href = "/login";
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Persistent Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800 bg-slate-950/40">
          <Link href="/admin" className="flex items-center space-x-3 group">
            <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${isMarketing ? "from-purple-500 to-indigo-700" : "from-sky-500 to-blue-700"} flex items-center justify-center shadow-md`}>
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <span className="text-sm font-black tracking-wider text-white uppercase block leading-none">
                PINNACLE
              </span>
              <span className={`text-[10px] font-bold ${isMarketing ? "text-purple-400" : "text-sky-400"} tracking-widest block uppercase mt-0.5`}>
                {isMarketing ? "Marketing Portal" : "Admin Portal"}
              </span>
            </div>
          </Link>

          {/* Close button for mobile */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg lg:hidden"
              aria-label="Close sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {isMarketing ? "Marketing Console" : "Management"}
          </div>
          {visibleNavItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  isActive
                    ? "bg-slate-800 text-white shadow-sm border border-slate-700/60"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                {item.icon(isActive)}
                <span>{item.label}</span>
                {isActive && (
                  <span className={`ml-auto w-1.5 h-4 ${isMarketing ? "bg-purple-500" : "bg-sky-500"} rounded-full`} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer / User info */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50 space-y-3">
          <div className="flex items-center space-x-3 px-1">
            <div className={`w-8 h-8 rounded-full ${isMarketing ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"} flex items-center justify-center font-bold text-xs uppercase`}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {adminName}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {adminEmail}
              </p>
            </div>
            {isMarketing ? (
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded">
                MARKETING
              </span>
            ) : (
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
                ADMIN
              </span>
            )}
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex flex-col space-y-1">
            <Link
              href="/"
              className="flex items-center px-2 py-1.5 text-xs text-sky-400 hover:text-sky-300 transition-colors font-medium"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View Live Storefront &rarr;
            </Link>

            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center w-full px-2 py-1.5 text-xs text-slate-400 hover:text-red-400 hover:bg-slate-800/40 rounded transition-colors text-left"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
