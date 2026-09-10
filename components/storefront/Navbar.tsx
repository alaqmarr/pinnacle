"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="w-full flex flex-col font-sans border-b border-gray-200">
      {/* Very Top Light Strip */}
      <div className="hidden md:flex justify-between items-center py-2 px-6 lg:px-12 bg-gray-50 text-xs font-medium text-gray-500 border-b border-gray-200">
        <div>Your Packaging & Supply Partner</div>
        <div className="flex items-center space-x-6">
          <Link href="/contact" className="hover:text-gray-900 transition-colors">Bulk Orders</Link>
          <Link href="/contact" className="hover:text-gray-900 transition-colors">Request a Quote</Link>
          <Link href="/contact" className="hover:text-gray-900 transition-colors">Track Order</Link>
          <span className="text-gray-300">|</span>
          <a href={`tel:${phone.replace(/[^0-9+]/g, '')}`} className="flex items-center text-gray-900 font-bold hover:text-[#d4af37] transition-colors">
            <svg className="w-3.5 h-3.5 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.036 11.036 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
            {phone}
          </a>
        </div>
      </div>

      {/* Main Header Area (White) */}
      <header className="bg-white py-5 px-6 lg:px-12 flex flex-wrap lg:flex-nowrap items-center justify-between gap-6">
        {/* Logo */}
        <Link href="/" className="flex items-center shrink-0">
          <div className="relative h-12 w-48 sm:h-14 sm:w-56">
            <Image
              src="/logo.png"
              alt="Pinnacle Distributing"
              fill
              className="object-contain object-left"
              priority
            />
          </div>
        </Link>

        {/* Search Bar */}
        <div className="flex-1 w-full lg:max-w-2xl order-3 lg:order-none mt-4 lg:mt-0">
          <form action="/products" onSubmit={handleSearch} className="flex items-center w-full border border-gray-300 rounded overflow-hidden bg-white focus-within:ring-1 focus-within:ring-[#1e293b] focus-within:border-[#1e293b] transition-all">
            <input
              type="search"
              name="search"
              placeholder="Search products, categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2.5 text-sm text-gray-900 focus:outline-none"
            />
            <button type="submit" className="bg-[#1e293b] text-white px-5 py-3 hover:bg-slate-800 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </button>
          </form>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-8 shrink-0">
          {session ? (
            <div className="relative group pb-4 -mb-4">
              <Link href="/account" className="flex items-center gap-2 cursor-pointer">
                <svg className="w-6 h-6 text-sky-600 group-hover:text-sky-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                <div className="flex flex-col">
                  <span className="text-[11px] font-medium text-gray-500 leading-tight">Welcome,</span>
                  <span className="text-sm font-bold text-sky-600 group-hover:text-sky-700 transition-colors leading-tight line-clamp-1 max-w-[100px]">{session.user?.name?.split(' ')[0] || "User"}</span>
                </div>
              </Link>
              <div className="absolute right-0 top-full mt-0 w-48 bg-white rounded-lg shadow-xl border border-slate-200 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <Link href="/account" className="block px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-sky-600">My Account</Link>
                {session.user?.role === "ADMIN" && (
                  <Link href="/admin" className="block px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-sky-600">Admin Dashboard</Link>
                )}
                {session.user?.role === "MARKETING" && (
                  <Link href="/admin" className="block px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-sky-600">Marketing Dashboard</Link>
                )}
                <div className="border-t border-slate-100 my-1"></div>
                <Link href="/api/auth/signout" className="block px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50">Sign Out</Link>
              </div>
            </div>
          ) : (
            <Link href="/login" className="flex items-center gap-2 group">
              <svg className="w-6 h-6 text-gray-700 group-hover:text-[#d4af37] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-gray-500 leading-tight">Sign In</span>
                <span className="text-sm font-bold text-gray-900 group-hover:text-[#d4af37] transition-colors leading-tight">Account</span>
              </div>
            </Link>
          )}
          
          <Link
            href="/cart"
            id="header-cart-btn"
            onClick={(e) => {
              e.preventDefault();
              openCart();
            }}
            className="flex items-center gap-2 group relative"
          >
            <svg className="w-6 h-6 text-gray-700 group-hover:text-[#d4af37] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            <div className="flex flex-col text-left">
              <span className="text-sm font-bold text-gray-900 group-hover:text-[#d4af37] transition-colors leading-tight">Cart</span>
            </div>
            {/* Badge */}
            <span className="cart-badge absolute -top-1.5 left-3.5 bg-[#1e293b] text-white text-[10px] font-bold px-1.5 min-w-[1.25rem] h-5 rounded-full flex items-center justify-center border-2 border-white" data-testid="cart-badge">
              {totalItems}
            </span>
          </Link>
        </div>
      </header>

      {/* Dark Blue Navigation Strip */}
      <nav className="bg-[#1e293b] text-white flex items-center px-6 lg:px-12 justify-between">
        <div className="flex items-center">
          {/* All Categories Dropdown Trigger */}
          <Link href="/categories" className="flex items-center gap-2 bg-[#151d29] hover:bg-[#0f151e] cursor-pointer py-3.5 px-6 transition-colors border-r border-[#2d3748]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            <span className="font-semibold text-sm">All Categories</span>
          </Link>
          
          {/* Dynamic Main Links */}
          <div className="hidden lg:flex items-center">
            {categories.slice(0, 6).map((cat) => (
              <Link key={cat.slug} href={`/categories/${cat.slug}`} className="py-3.5 px-5 text-sm font-medium hover:text-[#d4af37] transition-colors text-gray-300">
                {cat.name}
              </Link>
            ))}
            {categories.length === 0 && (
              <span className="py-3.5 px-5 text-sm font-medium text-gray-500 italic">No categories added yet</span>
            )}
            {categories.length > 6 && (
              <Link href="/categories" className="py-3.5 px-5 text-sm font-medium hover:text-[#d4af37] transition-colors text-gray-300 flex items-center gap-1">
                More
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </Link>
            )}
          </div>
        </div>

        {/* Request a Quote Button */}
        <Link href="/contact" className="bg-[#d4af37] hover:bg-[#b8952f] text-[#1e293b] font-bold text-sm py-3.5 px-8 transition-colors">
          Request a Quote
        </Link>
      </nav>
    </div>
  );
}
