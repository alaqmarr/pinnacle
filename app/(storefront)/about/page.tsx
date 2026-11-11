import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { getGlobalSettings, getPublicSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "About Us | Pinnacle Distributing",
  description:
    "Learn how Pinnacle Distributing supplies commercial packaging materials, corrugated cartons, pallet film, and facility janitorial products to warehouses and businesses.",
};

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const rawSettings = await getGlobalSettings();
  const settings = getPublicSettings(rawSettings);

  return (
    <div className="w-full py-10 px-4 sm:px-6 lg:px-10 xl:px-12 space-y-14">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-slate-900 transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="font-semibold text-slate-900">About Us</span>
      </nav>

      {/* Hero Banner */}
      <div className="bg-[#0B1E36] rounded-2xl p-8 sm:p-12 lg:p-16 text-white relative overflow-hidden">
        <div className="max-w-4xl relative z-10 space-y-5">
          <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-sky-400">
            Commercial Distribution &amp; Fulfillment
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Built for Operations That Cannot Afford Supply Delays.
          </h1>
          <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-3xl">
            {settings.companyName} supplies industrial corrugated cartons, pallet stretch wrap, strapping, and commercial janitorial supplies engineered for high-throughput warehouses, manufacturers, and facilities.
          </p>
          <div className="pt-3 flex flex-wrap gap-4">
            <Link
              href="/products"
              className="inline-flex items-center px-6 py-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold transition-colors"
            >
              Browse Catalog →
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center px-6 py-3 rounded-lg border border-white/30 hover:bg-white/10 text-white text-sm font-bold transition-colors"
            >
              Request Wholesale Quote
            </Link>
          </div>
        </div>
      </div>

      {/* Core Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-7 shadow-xs space-y-3">
          <div className="w-11 h-11 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h2 className="text-lg font-extrabold text-slate-900">Industrial Packaging Expertise</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            From ECT-rated corrugated shipping boxes to heavy-gauge stretch film and strapping systems, every specification is selected for load integrity in transit.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-7 shadow-xs space-y-3">
          <div className="w-11 h-11 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-lg font-extrabold text-slate-900">Facility &amp; Janitorial Readiness</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Keep commercial buildings, warehouses, and production floors compliant with commercial disinfectants, heavy-duty drum liners, and paper systems.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-7 shadow-xs space-y-3">
          <div className="w-11 h-11 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <h2 className="text-lg font-extrabold text-slate-900">Flexible Commercial Fulfillment</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Backed by Aiman Trading &amp; Manufacturing Inc., we support regional ground delivery, LTL pallet freight, authorized dock will-call pickup, and approved Net-30 terms.
          </p>
        </div>
      </div>

      {/* Facility Details Strip */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-600">
            Distribution Hub
          </span>
          <h3 className="text-xl font-extrabold text-slate-900">{settings.companyName}</h3>
          <p className="text-sm text-slate-600">{settings.address}</p>
          <p className="text-xs font-mono text-slate-500">{settings.hours || settings.businessHours}</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <a
            href={`tel:${settings.contactPhone.replace(/[^0-9+]/g, "")}`}
            className="inline-flex items-center px-5 py-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 text-sm font-bold transition-colors"
          >
            Call {settings.contactPhone}
          </a>
          <Link
            href="/register"
            className="inline-flex items-center px-5 py-3 rounded-lg bg-[#0B1E36] hover:bg-slate-800 text-white text-sm font-bold transition-colors"
          >
            Open a Wholesale Account →
          </Link>
        </div>
      </div>
    </div>
  );
}
