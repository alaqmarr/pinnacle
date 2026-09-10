import React from "react";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { formatUSD } from "@/lib/currency";
import { QuickAddButton } from "@/components/storefront/QuickAddButton";

export const dynamic = "force-dynamic";

export default async function StorefrontHomePage() {
  let categories: any[] = [];
  let products: any[] = [];

  try {
    const [cats, prods] = await Promise.all([
      prisma.category.findMany({
        take: 10,
        orderBy: { createdAt: "asc" },
      }),
      prisma.product.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
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
            alt="Your Trusted Packaging Partner for Scalable Supply. Reliable corrugated box supply with consistent quality, competitive pricing, and on-time delivery."
            width={1920}
            height={800}
            sizes="100vw"
            priority
            quality={100}
            className="w-full h-auto object-cover block"
          />
        </Link>
        {/* Visually hidden h1 for SEO */}
        <h1 className="sr-only">Your Trusted Packaging Partner for Scalable Supply</h1>
      </section>

      {/* 2. Categories Section (Dynamic from DB) */}
      <section className="py-20 px-6 lg:px-12 max-w-7xl mx-auto w-full relative">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px bg-slate-200 w-12 sm:w-24"></div>
            <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-slate-500">
              SHOP BY CATEGORY
            </span>
            <div className="h-px bg-slate-200 w-12 sm:w-24"></div>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-800 mb-4">
            Packaging & Facility <span className="text-[#B58A59]">Solutions</span>
          </h2>
          <p className="text-slate-500 text-lg font-medium max-w-2xl mx-auto">
            Quality supplies for a cleaner, safer and more efficient business.
          </p>
        </div>

        {/* Categories Grid or Clean Empty State */}
        {categories.length === 0 ? (
          <div className="py-12 px-6 rounded-xl border border-dashed border-slate-300 text-center bg-slate-50">
            <svg className="w-10 h-10 text-slate-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-base font-bold text-slate-700 mb-1">No categories available</p>
            <p className="text-xs text-slate-500 mb-4">
              Our packaging and janitorial catalog is currently being loaded. Check back shortly.
            </p>
            <Link
              href="/admin/categories"
              className="inline-flex items-center text-xs font-semibold text-blue-600 hover:underline"
            >
              Add categories via Admin Portal â†’
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
                  href={`/categories/${cat.id}`}
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

      {/* 3. Featured Products Section (Dynamic from DB) */}
      <section className="py-16 px-6 lg:px-12 max-w-[1400px] mx-auto w-full relative">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="h-px bg-slate-200 w-12 sm:w-24"></div>
            <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#B58A59]">
              FEATURED PRODUCTS
            </span>
            <div className="h-px bg-slate-200 w-12 sm:w-24"></div>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 mb-4">
            Quality Supplies for <span className="text-[#B58A59]">Every Business</span>
          </h2>
          <p className="text-slate-500 text-base sm:text-lg font-medium">
            Top products. Trusted quality. Ready to ship.
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
            {categories.slice(0, 6).map((cat) => (
              <Link
                key={cat.id}
                href={`/products?category=${cat.id}`}
                className="px-5 py-2 rounded-full bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                {cat.name}
              </Link>
            ))}
            {categories.length > 6 && (
              <Link
                href="/categories"
                className="px-5 py-2 rounded-full bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-colors flex items-center"
              >
                More
                <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Link>
            )}
          </div>
        )}

        {products.length === 0 ? (
          <div className="py-12 px-6 rounded-xl border border-dashed border-slate-300 text-center bg-white">
            <svg className="w-10 h-10 text-slate-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <p className="text-base font-bold text-slate-700 mb-1">No featured products found</p>
            <p className="text-xs text-slate-500 mb-4">
              New industrial packaging, strapping, and chemicals will be published soon.
            </p>
            <Link
              href="/admin/products"
              className="inline-flex items-center text-xs font-semibold text-blue-600 hover:underline"
            >
              Add products via Admin Portal â†’
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {products.map((prod, index) => {
              // Parse images
              let displayImage = "/images/placeholder-product.svg";
              if (prod.images) {
                try {
                  if (prod.images.startsWith("[")) {
                    const parsed = JSON.parse(prod.images);
                    if (Array.isArray(parsed) && parsed.length > 0) displayImage = parsed[0];
                  } else {
                    displayImage = prod.images;
                  }
                } catch {
                  displayImage = prod.images;
                }
              }

              // Fake rating for visual completeness matching mockup
              const reviewCount = (prod.name.length * 7) % 150 + 20;

              // Fake badge logic (cycle through some based on index)
              let badge = null;
              if (index % 5 === 0) badge = { text: "BEST SELLER", bg: "bg-[#C39A6A]", textCls: "text-white" };
              else if (index % 5 === 2) badge = { text: "ECO FRIENDLY", bg: "bg-[#427A5B]", textCls: "text-white" };
              else if (index % 5 === 3) badge = { text: "POPULAR", bg: "bg-[#C39A6A]", textCls: "text-white" };
              else if (index % 5 === 4) badge = { text: "HEAVY DUTY", bg: "bg-[#427A5B]", textCls: "text-white" };

              return (
                <div
                  key={prod.id}
                  className="bg-white rounded-xl border border-slate-200 flex flex-col justify-between shadow-xs hover:shadow-md transition-all group overflow-hidden"
                >
                  <div className="relative w-full aspect-square bg-white overflow-hidden flex items-center justify-center border-b border-slate-100">
                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex justify-between items-start z-10 pointer-events-none">
                      {badge ? (
                        <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded shadow-sm ${badge.bg} ${badge.textCls}`}>
                          {badge.text}
                        </span>
                      ) : (
                        <span></span>
                      )}
                      
                      <button className="w-7 h-7 rounded-full border border-slate-200 bg-white shadow-sm flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 transition-colors pointer-events-auto">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      </button>
                    </div>

                    <Link href={`/products/${prod.id}`} className="w-full h-full flex items-center justify-center">
                      <img 
                        src={displayImage} 
                        alt={prod.name} 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </Link>
                  </div>

                  <div className="flex flex-col flex-grow justify-between p-4 pt-3">
                    <div>
                      <Link href={`/products/${prod.id}`}>
                        <h3 className="font-extrabold text-slate-900 text-[13px] leading-tight group-hover:text-blue-600 transition-colors line-clamp-1">
                          {prod.name}
                        </h3>
                      </Link>
                      <p className="text-[11px] text-slate-500 mt-0.5 font-medium line-clamp-1">
                        {prod.sku || prod.description || "Premium Quality"}
                      </p>

                      {/* Stars */}
                      <div className="flex items-center mt-1.5 space-x-1">
                        <div className="flex text-[#F5B041]">
                          <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                          <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                          <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                          <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                          <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                        </div>
                        <span className="text-[10px] text-slate-500 font-medium">({reviewCount})</span>
                      </div>
                    </div>

                      <div className="mt-3">
                        <div className="text-lg font-black text-slate-900 mb-3">
                          {formatUSD(prod.price)}
                        </div>

                        <QuickAddButton 
                          product={{
                            id: prod.id,
                            name: prod.name,
                            slug: prod.slug,
                            price: prod.price,
                            image: displayImage,
                            sku: prod.sku,
                          }}
                        />
                      </div>
                  </div>
                </div>
              );
            })}
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
      <section className="relative bg-[#FAFAFA] overflow-hidden flex flex-col lg:flex-row border-y border-slate-200">
        
        {/* Left Side (Text content) */}
        <div className="w-full lg:w-[55%] py-16 px-6 lg:py-24 lg:pl-16 xl:pl-24 lg:pr-12 flex flex-col justify-center z-10 bg-[#FAFAFA]">
          <div className="flex items-center space-x-4 mb-6">
            <span className="text-xs font-black tracking-[0.2em] uppercase text-[#1956A6]">
              WHO WE ARE
            </span>
            <div className="h-px w-16 bg-slate-300"></div>
          </div>

          <h2 className="text-[2.5rem] lg:text-5xl font-black tracking-tight text-[#0B1E36] mb-6 leading-[1.1]">
            Reliable Supplies.<br/>
            <span className="text-[#1956A6]">Stronger Operations.</span>
          </h2>

          <p className="text-slate-600 mb-6 leading-relaxed font-medium">
            <strong className="text-slate-900 font-bold">Pinnacle Distributing</strong> is built for businesses that can't afford interruptions. We supply high-performance packaging materials and janitorial solutions that keep warehouses, facilities, and operations moving without delay.
          </p>

          <p className="text-slate-600 mb-8 leading-relaxed font-medium">
            Powered by the experience of <strong className="text-slate-900 font-bold">Aiman Trading & Manufacturing Inc.</strong>, our distribution model focuses on speed, consistency, bulk availability, and real-world reliability — not short-term fixes.
          </p>

          <div className="border-l-[6px] border-[#1956A6] pl-6 mb-10">
            <p className="text-[#0B1E36] font-extrabold text-[1.1rem] leading-snug">
              Because when your supplies are dependable,
              <br/>
              <span className="text-[#1956A6]">everything else runs smoother.</span>
            </p>
          </div>

          <div>
            <Link
              href="/about"
              className="inline-flex items-center justify-center px-8 py-3.5 text-sm font-bold text-white bg-[#0F4288] hover:bg-[#0B3066] transition-colors shadow-sm"
            >
              Learn More About Us
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Right Side (Image + Angled Cut) */}
        <div className="w-full lg:w-[45%] relative min-h-[400px] lg:min-h-full">
          {/* We use a clip-path on the image wrapper to make the angled cut on desktop */}
          <div 
            className="absolute inset-0 bg-slate-200 lg:[clip-path:polygon(15%_0%,100%_0%,100%_100%,0%_100%)]"
          >
            {/* The image itself */}
            <img 
              src="https://images.unsplash.com/photo-1586528116311-ad8ed7c80a30?auto=format&fit=crop&q=80&w=2070" 
              alt="Warehouse packaging supplies"
              className="w-full h-full object-cover"
            />
            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-white/10"></div>
            
            {/* Floating Text box */}
            <div className="absolute top-12 right-12 z-20 flex flex-col items-end text-right">
              <h3 className="text-[#0B1E36] font-black text-2xl lg:text-3xl leading-tight uppercase mix-blend-multiply drop-shadow-sm rotate-[-4deg] tracking-widest origin-top-right scale-95 opacity-80">
                Supplying<br/>Businesses<br/>Building<br/>Tomorrow
              </h3>
              <div className="h-1 w-12 bg-[#0F4288] mt-4 mr-2"></div>
            </div>
          </div>
        </div>
      </section>



      {/* 6. CTA Section */}
      <section className="relative bg-[#0B1E36] overflow-hidden">
        {/* Background Overlay image for right side */}
        <div className="absolute inset-y-0 right-0 w-full lg:w-1/2 opacity-20 pointer-events-none mix-blend-overlay">
          <img 
            src="https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&q=80&w=2070" 
            alt="Warehouse Background"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="relative max-w-[1400px] mx-auto px-6 lg:px-12 py-16 lg:py-20 flex flex-col lg:flex-row items-center justify-between">
          
          {/* Left Text */}
          <div className="w-full lg:w-1/2 text-left mb-12 lg:mb-0 lg:pr-10">
            <div className="flex items-center space-x-4 mb-6">
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-400">
                LET'S KEEP YOUR BUSINESS MOVING
              </span>
              <div className="h-px w-16 bg-slate-600"></div>
            </div>
            
            <h2 className="text-3xl lg:text-[2.5rem] font-bold text-white mb-4 tracking-tight leading-tight">
              Need Supplies for Your Business?
            </h2>
            <p className="text-slate-300 mb-8 font-medium max-w-md">
              Get in touch with our team for bulk orders, custom requirements, or any questions.
            </p>

            <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link
                href="/quote"
                className="w-full sm:w-auto px-8 py-3 text-sm font-bold text-white bg-[#0F4288] hover:bg-[#1956A6] transition-colors flex items-center justify-center"
              >
                Request a Quote
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/contact"
                className="w-full sm:w-auto px-8 py-3 text-sm font-bold text-white bg-transparent border border-white/50 hover:border-white hover:bg-white/10 transition-colors flex items-center justify-center"
              >
                Contact Us
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Right Content */}
          <div className="w-full lg:w-1/2 flex flex-row items-center justify-end lg:pl-10">
            <div className="flex border-l border-slate-700/80 pl-10 h-full py-2">
              <div className="flex flex-col space-y-8 sm:space-y-0 sm:flex-row sm:space-x-12 justify-center items-start">
                
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full border border-slate-500 flex items-center justify-center text-white mb-4 bg-[#0B1E36]">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <h4 className="font-bold text-white text-xs mb-1.5">Talk to Our Team</h4>
                  <p className="text-slate-400 text-[11px] font-medium leading-relaxed max-w-[120px]">
                    Quick support,<br/>real solutions.
                  </p>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full border border-slate-500 flex items-center justify-center text-white mb-4 bg-[#0B1E36]">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h4 className="font-bold text-white text-xs mb-1.5">Bulk Pricing</h4>
                  <p className="text-slate-400 text-[11px] font-medium leading-relaxed max-w-[120px]">
                    Competitive rates<br/>for your business.
                  </p>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 rounded-full border border-slate-500 flex items-center justify-center text-white mb-4 bg-[#0B1E36]">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </div>
                  <h4 className="font-bold text-white text-xs mb-1.5">Reliable Partnership</h4>
                  <p className="text-slate-400 text-[11px] font-medium leading-relaxed max-w-[120px]">
                    Here for your<br/>long-term growth.
                  </p>
                </div>

              </div>

              {/* Vertical Pack Supply Support Grow text */}
              <div className="hidden lg:flex flex-col items-start ml-12 text-slate-300 text-[11px] font-bold tracking-[0.2em] leading-loose uppercase border-l border-slate-700/80 pl-12 py-2">
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
