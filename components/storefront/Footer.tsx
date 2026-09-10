import React from "react";
import Link from "next/link";

export function Footer({ settings }: { settings?: any }) {
  return (
    <footer className="w-full relative mt-16">
      {/* 4-column icon strip */}
      <div className="bg-[#FAFAFA] border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex flex-col items-center text-center">
              <svg className="w-8 h-8 text-sky-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <h4 className="font-bold text-slate-900 text-sm">Quality Products</h4>
              <p className="text-xs text-slate-500 mt-1">Premium packaging & janitorial supplies</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <svg className="w-8 h-8 text-sky-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h4 className="font-bold text-slate-900 text-sm">Fast Dispatch</h4>
              <p className="text-xs text-slate-500 mt-1">Orders ship within 24 hours</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <svg className="w-8 h-8 text-sky-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h4 className="font-bold text-slate-900 text-sm">Bulk Pricing</h4>
              <p className="text-xs text-slate-500 mt-1">Competitive rates for large orders</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <svg className="w-8 h-8 text-sky-700 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h4 className="font-bold text-slate-900 text-sm">Expert Support</h4>
              <p className="text-xs text-slate-500 mt-1">Dedicated team to help you</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dark Navy Body */}
      <div className="bg-[#0B1E36] text-white pt-16 pb-8 relative overflow-hidden">
        {/* Decorative Watermark */}
        <div className="absolute right-[-5%] bottom-[-10%] opacity-5 text-[150px] font-black uppercase tracking-tighter leading-none transform -rotate-12 pointer-events-none select-none">
          Pack<br/>Supply<br/>Succeed
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
            
            {/* Column 1: Brand & About */}
            <div className="space-y-6">
              <Link href="/" className="inline-flex items-center gap-2">
                <div className="w-8 h-8 bg-sky-500 rounded flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <span className="font-bold text-xl tracking-tight text-white">
                  {settings?.companyName ? settings.companyName.split(' ')[0] : "Pinnacle"}<span className="text-sky-400 text-sm align-top ml-0.5">®</span>
                </span>
              </Link>
              <p className="text-slate-400 text-sm leading-relaxed">
                Your trusted partner for commercial packaging, shipping supplies, and professional janitorial equipment. We deliver quality and reliability to businesses nationwide.
              </p>
            </div>

            {/* Column 2: Quick Links */}
            <div>
              <h3 className="text-white font-bold tracking-wider uppercase text-sm mb-6">Quick Links</h3>
              <ul className="space-y-4">
                <li><Link href="/" className="text-slate-400 hover:text-white transition-colors text-sm">Home</Link></li>
                <li><Link href="/products" className="text-slate-400 hover:text-white transition-colors text-sm">All Products</Link></li>
                <li><Link href="/categories" className="text-slate-400 hover:text-white transition-colors text-sm">Categories</Link></li>
                <li><Link href="/contact" className="text-slate-400 hover:text-white transition-colors text-sm">Contact Us</Link></li>
              </ul>
            </div>

            {/* Column 3: Contact */}
            <div>
              <h3 className="text-white font-bold tracking-wider uppercase text-sm mb-6">Contact</h3>
              <ul className="space-y-4 text-slate-400 text-sm">
                <li className="flex gap-3">
                  <svg className="w-5 h-5 text-sky-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="whitespace-pre-line">{settings?.address || "1234 Industrial Parkway\nSuite 100\nDallas, TX 75201"}</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-sky-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>{settings?.contactPhone || "(800) 555-0199"}</span>
                </li>
                <li className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-sky-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>{settings?.contactEmail || "info@pinnacledistributing.com"}</span>
                </li>
              </ul>
            </div>

            {/* Column 4: Newsletter */}
            <div>
              <h3 className="text-white font-bold tracking-wider uppercase text-sm mb-6">Stay Updated</h3>
              <p className="text-slate-400 text-sm mb-4">Subscribe for industry news and exclusive wholesale offers.</p>
              <form className="flex">
                <input 
                  type="email" 
                  placeholder="Email address" 
                  className="w-full bg-[#162A43] border border-[#233A58] text-white px-4 py-2.5 rounded-l text-sm focus:outline-none focus:border-sky-500"
                />
                <button type="submit" className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2.5 rounded-r font-bold text-sm transition-colors">
                  Subscribe
                </button>
              </form>
            </div>
          </div>

          <div className="border-t border-[#1C324D] mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-500 text-xs">
              &copy; {new Date().getFullYear()} {settings?.companyName || "Pinnacle Distributing"}. All rights reserved.
            </p>
            <div className="flex space-x-6 text-slate-500 text-xs">
              <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link href="#" className="hover:text-white transition-colors">Returns</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
