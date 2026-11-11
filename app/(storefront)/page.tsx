import React from "react";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/storefront/ProductCard";

export const dynamic = "force-dynamic";

export default async function StorefrontHomePage() {
  let categories: any[] = [];
  let products: any[] = [];

  try {
    const [cats, prods] = await Promise.all([
      prisma.category.findMany({
        take: 12,
        orderBy: { createdAt: "asc" },
      }),
      prisma.product.findMany({
        take: 12,
        orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
        include: { category: true },
      }),
    ]);
    categories = cats;
    products = prods;
  } catch (err) {
    console.error("[StorefrontHomePage] Error loading dynamic homepage data:", err);
  }

  return (
    <div className="flex flex-col w-full bg-white font-sans">
      {/* 1. Hero Section */}
      <section className="relative w-full overflow-hidden group">
        <Link href="/products" className="block w-full leading-none">
          <Image
            src="/hero.png"
            alt="Industrial Packaging & Janitorial Supplies — Reliable corrugated box supply with consistent quality, competitive pricing, and on-time delivery."
            width={1920}
            height={800}
            sizes="100vw"
            priority
            quality={100}
            className="w-full h-auto object-cover block"
          />
        </Link>
        <h1 className="sr-only">
          Industrial Packaging &amp; Janitorial Supplies — Your Trusted Packaging Partner for Scalable Supply
        </h1>
      </section>

      {/* 2. Categories Section (Dynamic from DB, Full-Screen Width) */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-10 xl:px-12 w-full relative">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px bg-slate-200 w-12 sm:w-24"></div>
            <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-slate-500">
              SHOP BY CATEGORY
            </span>
            <div className="h-px bg-slate-200 w-12 sm:w-24"></div>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-800 mb-4">
            Packaging &amp; Facility <span className="text-[#B58A59]">Solutions</span>
          </h2>
          <p className="text-slate-500 text-base sm:text-lg font-medium max-w-2xl mx-auto">
            Commercial supplies engineered for cleaner, safer, and more efficient operations.
          </p>
        </div>

        {categories.length === 0 ? (
          <div className="py-12 px-6 rounded-xl border border-dashed border-slate-300 text-center bg-slate-50">
            <svg className="w-10 h-10 text-slate-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-base font-bold text-slate-700 mb-1">Catalog Categories Coming Soon</p>
            <p className="text-xs text-slate-500 mb-4">
              Need immediate bulk pricing on corrugated cartons, stretch wrap, or facility supplies? Contact our commercial sales desk.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center text-xs font-semibold text-sky-600 hover:underline"
            >
              Request Commercial Quote →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5">
            {categories.map((cat) => {
              let displayImage = "";
              if (cat.image) {
                try {
                  if (cat.image.startsWith("[")) {
                    const parsed = JSON.parse(cat.image);
                    if (Array.isArray(parsed) && parsed.length > 0) displayImage = parsed[0];
                  } else {
                    displayImage = cat.image;
                  }
                } catch {
                  displayImage = cat.image;
                }
              }

              return (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.slug || cat.id}`}
                  className="group relative bg-[#F8F9FA] rounded-2xl flex flex-col justify-between overflow-hidden border border-slate-100 hover:border-slate-200 shadow-xs hover:shadow-md transition-all duration-300 min-h-[220px]"
                >
                  <div className="w-full aspect-[4/3] relative flex items-center justify-center overflow-hidden bg-slate-100">
                    {displayImage ? (
                      <img
                        src={displayImage}
                        alt={cat.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-16 h-16 text-slate-300">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between z-10 w-full relative p-5 pt-4 mt-auto">
                    <div className="flex items-center gap-3 w-full pr-2">
                      <div className="absolute -top-6 left-5 w-12 h-12 rounded-full bg-[#FCF5ED] text-[#A68159] flex items-center justify-center shrink-0 border-4 border-[#F8F9FA] shadow-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                      </div>
                      <h3 className="font-extrabold text-slate-800 text-sm leading-tight group-hover:text-slate-900 line-clamp-2 mt-4">
                        {cat.name}
                      </h3>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-white text-slate-700 flex items-center justify-center shrink-0 shadow-sm border border-slate-200 group-hover:text-blue-600 transition-colors mt-4">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {categories.length > 0 && (
          <div className="mt-10 flex justify-center">
            <Link
              href="/categories"
              className="inline-flex items-center px-6 py-3 rounded-lg bg-[#DEBE96] hover:bg-[#D4AD7E] text-slate-900 font-extrabold text-sm transition-colors shadow-sm"
            >
              View All Categories
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        )}
      </section>

      {/* 3. Catalog Products Section (Dynamic from DB, Full-Screen Width, Zero Dummy Ratings) */}
      <section className="py-16 px-4 sm:px-6 lg:px-10 xl:px-12 w-full relative border-t border-slate-100">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px bg-slate-200 w-12 sm:w-24"></div>
            <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#B58A59]">
              COMMERCIAL CATALOG
            </span>
            <div className="h-px bg-slate-200 w-12 sm:w-24"></div>
          </div>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 mb-4">
            Quality Supplies for <span className="text-[#B58A59]">Every Business</span>
          </h2>
          <p className="text-slate-500 text-base sm:text-lg font-medium">
            Wholesale inventory ready for regional ground and LTL pallet dispatch.
          </p>
        </div>

        {/* Category Pills */}
        {categories.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            <Link
              href="/products"
              className="px-5 py-2 rounded-full bg-[#0B1E36] text-white text-xs font-bold shadow-sm hover:bg-slate-800 transition-colors"
            >
              All Products
            </Link>
            {categories.slice(0, 8).map((cat) => (
              <Link
                key={cat.id}
                href={`/products?category=${encodeURIComponent(cat.slug || cat.id)}`}
                className="px-5 py-2 rounded-full bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}

        {products.length === 0 ? (
          <div className="py-12 px-6 rounded-xl border border-dashed border-slate-300 text-center bg-slate-50">
            <svg className="w-10 h-10 text-slate-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <p className="text-base font-bold text-slate-700 mb-1">Catalog Stocking in Progress</p>
            <p className="text-xs text-slate-500 mb-4">
              Contact our commercial dispatch team directly for current corrugated carton, stretch film, and janitorial inventory pricing.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center text-xs font-semibold text-sky-600 hover:underline"
            >
              Contact Sales &amp; Dispatch →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-5">
            {products.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        )}

        {products.length > 0 && (
          <div className="mt-10 flex justify-center">
            <Link
              href="/products"
              className="inline-flex items-center px-6 py-3 rounded-lg bg-[#0B1E36] hover:bg-[#1a3352] text-white font-extrabold text-sm transition-colors shadow-sm"
            >
              View All Products
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>
        )}
      </section>

      {/* 4. Who We Are Section */}
      <section className="relative w-full bg-[#FAFAFA] overflow-hidden flex flex-col lg:flex-row border-y border-slate-200">
        <div className="w-full lg:w-[55%] py-16 px-4 sm:px-6 lg:py-24 lg:pl-12 xl:pl-16 lg:pr-12 flex flex-col justify-center z-10 bg-[#FAFAFA]">
          <div className="flex items-center space-x-4 mb-6">
            <span className="text-xs font-black tracking-[0.2em] uppercase text-[#1956A6]">
              WHO WE ARE
            </span>
            <div className="h-px w-16 bg-slate-300"></div>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-[#0B1E36] mb-6 leading-[1.1]">
            Reliable Supplies.<br />
            <span className="text-[#1956A6]">Stronger Operations.</span>
          </h2>

          <p className="text-slate-600 mb-6 leading-relaxed font-medium">
            <strong className="text-slate-900 font-bold">Pinnacle Distributing</strong> is built for businesses that cannot afford supply chain interruptions. We deliver commercial-grade Industrial Packaging &amp; Janitorial Supplies that keep warehouses, fulfillment centers, and facilities operating smoothly.
          </p>

          <p className="text-slate-600 mb-8 leading-relaxed font-medium">
            Powered by the manufacturing and sourcing experience of <strong className="text-slate-900 font-bold">Aiman Trading &amp; Manufacturing Inc.</strong>, our distribution model focuses on speed, consistency, pallet availability, and dependable fulfillment.
          </p>

          <div className="border-l-[6px] border-[#1956A6] pl-6 mb-10">
            <p className="text-[#0B1E36] font-extrabold text-[1.1rem] leading-snug">
              Because when your supplies are dependable,
              <br />
              <span className="text-[#1956A6]">everything else runs smoother.</span>
            </p>
          </div>

          <div>
            <Link
              href="/about"
              className="inline-flex items-center justify-center px-8 py-3.5 text-sm font-bold text-white bg-[#0F4288] hover:bg-[#0B3066] transition-colors shadow-sm rounded-lg"
            >
              Learn More About Us
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>

        <div className="w-full lg:w-[45%] relative min-h-[380px] lg:min-h-full">
          <div className="absolute inset-0 bg-slate-200 lg:[clip-path:polygon(12%_0%,100%_0%,100%_100%,0%_100%)]">
            <img
              src="https://images.unsplash.com/photo-1586528116311-ad8ed7c80a30?auto=format&fit=crop&q=80&w=2070"
              alt="Warehouse packaging supplies"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-white/10"></div>

            <div className="absolute top-12 right-8 sm:right-12 z-20 flex flex-col items-end text-right">
              <h3 className="text-[#0B1E36] font-black text-2xl lg:text-3xl leading-tight uppercase mix-blend-multiply drop-shadow-sm rotate-[-4deg] tracking-widest origin-top-right scale-95 opacity-80">
                Supplying<br />Businesses<br />Building<br />Tomorrow
              </h3>
              <div className="h-1 w-12 bg-[#0F4288] mt-4 mr-2"></div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CTA Section (Full-Screen Width) */}
      <section className="relative w-full bg-[#0B1E36] overflow-hidden">
        <div className="absolute inset-y-0 right-0 w-full lg:w-1/2 opacity-20 pointer-events-none mix-blend-overlay">
          <img
            src="https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&q=80&w=2070"
            alt="Warehouse Background"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="relative w-full px-4 sm:px-6 lg:px-10 xl:px-12 py-16 lg:py-20 flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="w-full lg:w-1/2 text-left lg:pr-10">
            <div className="flex items-center space-x-4 mb-6">
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400">
                LET&apos;S KEEP YOUR BUSINESS MOVING
              </span>
              <div className="h-px w-16 bg-slate-600"></div>
            </div>

            <h2 className="text-3xl lg:text-[2.5rem] font-bold text-white mb-4 tracking-tight leading-tight">
              Need Supplies for Your Business?
            </h2>
            <p className="text-slate-300 mb-8 font-medium max-w-xl">
              Connect with our commercial sales and dispatch team for pallet orders, custom carton dimensions, Net-30 terms, or recurring supply agreements.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link
                href="/contact"
                className="w-full sm:w-auto px-8 py-3.5 text-sm font-bold text-white bg-[#0F4288] hover:bg-[#1956A6] transition-colors flex items-center justify-center rounded-lg"
              >
                Request a Quote
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/products"
                className="w-full sm:w-auto px-8 py-3.5 text-sm font-bold text-white bg-transparent border border-white/50 hover:border-white hover:bg-white/10 transition-colors flex items-center justify-center rounded-lg"
              >
                Browse Catalog
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>

          <div className="w-full lg:w-1/2 flex flex-row items-center lg:justify-end">
            <div className="flex lg:border-l border-slate-700/80 lg:pl-10 h-full py-2 w-full lg:w-auto justify-between lg:justify-end">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10 items-start w-full">
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full border border-slate-500 flex items-center justify-center text-white mb-4 bg-[#0B1E36]">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <h4 className="font-bold text-white text-xs mb-1.5">Talk to Our Team</h4>
                  <p className="text-slate-400 text-[11px] font-medium leading-relaxed max-w-[140px]">
                    Direct commercial support &amp; sourcing.
                  </p>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full border border-slate-500 flex items-center justify-center text-white mb-4 bg-[#0B1E36]">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h4 className="font-bold text-white text-xs mb-1.5">Volume Pricing</h4>
                  <p className="text-slate-400 text-[11px] font-medium leading-relaxed max-w-[140px]">
                    Competitive case &amp; pallet rates.
                  </p>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full border border-slate-500 flex items-center justify-center text-white mb-4 bg-[#0B1E36]">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </div>
                  <h4 className="font-bold text-white text-xs mb-1.5">Reliable Partnership</h4>
                  <p className="text-slate-400 text-[11px] font-medium leading-relaxed max-w-[140px]">
                    Consistent stock for growing facilities.
                  </p>
                </div>
              </div>

              <div className="hidden xl:flex flex-col items-start ml-12 text-slate-300 text-[11px] font-bold tracking-[0.2em] leading-loose uppercase border-l border-slate-700/80 pl-12 py-2">
                <span>PACK</span>
                <span>SUPPLY</span>
                <span>SUPPORT</span>
                <span>GROW</span>
                <div className="w-6 h-px bg-slate-500 mt-4"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
