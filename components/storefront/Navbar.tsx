"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useCart } from "@/context/CartContext";

export interface NavbarProps {
  companyName?: string;
  phone?: string;
  categories?: { name: string; slug: string }[];
  session?: any;
}

export function Navbar({
  companyName = "Pinnacle Distributing",
  phone = "+1 (800) 555-0199",
  categories = [],
  session,
}: NavbarProps) {
  const router = useRouter();
  const { totalItems, openCart } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/products");
    }
  };

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    try {
      await fetch("/api/auth/signout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callbackUrl: "/login?signedOut=true" }),
      });
    } catch {
      // Proceed to clear client state
    }
    try {
      await signOut({ redirect: false });
    } catch {
      // Ignore
    }
    window.location.assign("/login?signedOut=true");
  };

  const firstName = session?.user?.name?.trim()?.split(" ")[0] || session?.user?.email?.split("@")[0] || "Account";

  return (
    <div className="w-full flex flex-col font-sans border-b border-gray-200 bg-white">
      {/* Top Utility Strip */}
      <div className="hidden md:flex justify-between items-center py-2 px-4 sm:px-6 lg:px-10 xl:px-12 bg-gray-50 text-xs font-medium text-gray-500 border-b border-gray-200 w-full">
        <div>{companyName} — Commercial Packaging &amp; Janitorial Supply Partner</div>
        <div className="flex items-center space-x-6">
          <Link href="/products" className="hover:text-gray-900 transition-colors">
            Catalog
          </Link>
          <Link href="/about" className="hover:text-gray-900 transition-colors">
            About Us
          </Link>
          <Link href="/contact" className="hover:text-gray-900 transition-colors">
            Request a Quote
          </Link>
          <Link
            href={session ? "/account" : "/login?callbackUrl=/account"}
            className="hover:text-gray-900 transition-colors"
          >
            Order History
          </Link>
          <span className="text-gray-300">|</span>
          <a
            href={`tel:${phone.replace(/[^0-9+]/g, "")}`}
            className="flex items-center text-gray-900 font-bold hover:text-[#d4af37] transition-colors"
          >
            <svg className="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.036 11.036 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
            {phone}
          </a>
        </div>
      </div>

      {/* Main Header Area */}
      <header className="w-full bg-white py-4 sm:py-5 px-4 sm:px-6 lg:px-10 xl:px-12 flex flex-wrap lg:flex-nowrap items-center justify-between gap-4 lg:gap-8">
        <div className="flex items-center gap-3">
          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="lg:hidden p-2 -ml-2 rounded-lg text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-800"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <div className="relative h-11 w-44 sm:h-14 sm:w-56">
              <Image
                src="/logo.png"
                alt={companyName}
                fill
                className="object-contain object-left"
                priority
              />
            </div>
          </Link>
        </div>

        {/* Search Bar */}
        <div className="flex-1 w-full lg:max-w-3xl order-3 lg:order-none mt-2 lg:mt-0">
          <form
            action="/products"
            onSubmit={handleSearch}
            className="flex items-center w-full border border-gray-300 rounded-lg overflow-hidden bg-white focus-within:ring-1 focus-within:ring-[#1e293b] focus-within:border-[#1e293b] transition-all"
          >
            <input
              type="search"
              name="search"
              placeholder="Search products, SKUs, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2.5 text-sm text-gray-900 focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Search products"
              className="bg-[#1e293b] text-white px-5 py-3 hover:bg-slate-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </form>
        </div>

        {/* Account & Cart Actions */}
        <div className="flex items-center gap-4 sm:gap-6 shrink-0">
          {session?.user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                aria-expanded={userMenuOpen}
                className="flex items-center gap-2 cursor-pointer rounded-lg px-2.5 py-1.5 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-full bg-sky-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                  {firstName.slice(0, 1).toUpperCase()}
                </div>
                <div className="hidden sm:flex flex-col">
                  <span className="text-[11px] font-medium text-gray-500 leading-tight">
                    Signed in
                  </span>
                  <span className="text-sm font-bold text-slate-900 leading-tight max-w-[120px] truncate flex items-center gap-1">
                    {firstName}
                    <svg className="w-3.5 h-3.5 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </div>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                  <div className="px-4 py-2.5 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {session.user?.name || "Wholesale User"}
                    </p>
                    <p className="text-xs text-slate-500 font-mono truncate">
                      {session.user?.email}
                    </p>
                    {session.user?.role && (
                      <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-slate-100 text-slate-700">
                        {session.user.role}
                      </span>
                    )}
                  </div>

                  <Link
                    href="/account"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-sky-600 transition-colors"
                  >
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    My Account &amp; Orders
                  </Link>

                  {session.user?.role === "ADMIN" && (
                    <Link
                      href="/admin"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-sky-600 transition-colors"
                    >
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                      Admin Dashboard
                    </Link>
                  )}

                  {session.user?.role === "MARKETING" && (
                    <Link
                      href="/admin/marketing"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-purple-600 transition-colors"
                    >
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6" />
                      </svg>
                      Marketing Portal
                    </Link>
                  )}

                  <div className="border-t border-slate-100 my-1" />

                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors text-left disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {signingOut ? "Signing Out..." : "Sign Out"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/login"
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold text-slate-800 hover:bg-slate-100 transition-colors"
              >
                <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Sign In</span>
              </Link>
              <Link
                href="/register"
                className="hidden sm:inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider bg-slate-900 text-white hover:bg-slate-800 transition-colors"
              >
                Register
              </Link>
            </div>
          )}

          <Link
            href="/cart"
            id="header-cart-btn"
            onClick={(e) => {
              e.preventDefault();
              openCart();
            }}
            className="flex items-center gap-2 group relative px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <div className="relative">
              <svg
                className="w-6 h-6 text-gray-700 group-hover:text-[#d4af37] transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <span
                className="cart-badge absolute -top-2 -right-2 bg-[#1e293b] text-white text-[10px] font-bold px-1.5 min-w-[1.25rem] h-5 rounded-full flex items-center justify-center border-2 border-white"
                data-testid="cart-badge"
              >
                {totalItems}
              </span>
            </div>
            <span className="hidden sm:inline text-sm font-bold text-gray-900 group-hover:text-[#d4af37] transition-colors leading-tight ml-1">
              Cart
            </span>
          </Link>
        </div>
      </header>

      {/* Dark Slate Navigation Strip */}
      <nav className="w-full bg-[#1e293b] text-white flex items-center px-4 sm:px-6 lg:px-10 xl:px-12 justify-between">
        <div className="flex items-center overflow-x-auto no-scrollbar">
          <Link
            href="/categories"
            className="flex items-center gap-2 bg-[#151d29] hover:bg-[#0f151e] cursor-pointer py-3.5 px-5 sm:px-6 transition-colors border-r border-[#2d3748] shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="font-semibold text-sm">All Categories</span>
          </Link>

          <Link
            href="/products"
            className="hidden md:inline-flex py-3.5 px-5 text-sm font-medium hover:text-[#d4af37] transition-colors text-gray-200 shrink-0"
          >
            All Products
          </Link>

          <div className="hidden lg:flex items-center">
            {categories.slice(0, 6).map((cat) => (
              <Link
                key={cat.slug}
                href={`/categories/${cat.slug}`}
                className="py-3.5 px-5 text-sm font-medium hover:text-[#d4af37] transition-colors text-gray-300 shrink-0"
              >
                {cat.name}
              </Link>
            ))}
            {categories.length > 6 && (
              <Link
                href="/categories"
                className="py-3.5 px-5 text-sm font-medium hover:text-[#d4af37] transition-colors text-gray-300 flex items-center gap-1 shrink-0"
              >
                More
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Link>
            )}
          </div>
        </div>

        <Link
          href="/contact"
          className="bg-[#d4af37] hover:bg-[#b8952f] text-[#1e293b] font-bold text-xs sm:text-sm py-3.5 px-5 sm:px-8 transition-colors shrink-0"
        >
          Request a Quote
        </Link>
      </nav>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-t border-slate-200 px-4 py-4 space-y-4 shadow-lg">
          <div className="space-y-1">
            <Link
              href="/products"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm font-bold text-slate-900 hover:bg-slate-100"
            >
              All Products
            </Link>
            <Link
              href="/categories"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm font-bold text-slate-900 hover:bg-slate-100"
            >
              All Categories
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/categories/${cat.slug}`}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-5 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              >
                {cat.name}
              </Link>
            ))}
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              About Us
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100"
            >
              Contact &amp; Bulk Quotes
            </Link>
          </div>

          <div className="border-t border-slate-200 pt-3">
            {session?.user ? (
              <div className="space-y-1">
                <Link
                  href="/account"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm font-bold text-sky-700 hover:bg-sky-50"
                >
                  My Account ({firstName})
                </Link>
                {session.user?.role === "ADMIN" && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Admin Dashboard
                  </Link>
                )}
                {session.user?.role === "MARKETING" && (
                  <Link
                    href="/admin/marketing"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2.5 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Marketing Portal
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-bold text-red-600 hover:bg-red-50"
                >
                  {signingOut ? "Signing Out..." : "Sign Out"}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex justify-center py-2.5 px-4 rounded-lg border border-slate-300 text-sm font-bold text-slate-800 hover:bg-slate-50"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex justify-center py-2.5 px-4 rounded-lg bg-slate-900 text-sm font-bold text-white hover:bg-slate-800"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
