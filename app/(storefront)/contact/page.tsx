import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { getGlobalSettings, getPublicSettings } from "@/lib/settings";
import { ContactForm } from "@/components/storefront/ContactForm";

export const metadata: Metadata = {
  title: "Contact & Facility Hours | Pinnacle Distributing",
  description:
    "Get in touch with Pinnacle Distributing for commercial freight quotes, product inquiries, warehouse operating hours, and directions to our distribution facility.",
  openGraph: {
    title: "Contact & Facility Hours | Pinnacle Distributing",
    description:
      "Contact our commercial dispatch team for bulk wholesale pricing and warehouse fulfillment inquiries.",
  },
};

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const rawSettings = await getGlobalSettings();
  const settings = getPublicSettings(rawSettings);

  return (
    <div className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full space-y-12">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-xs text-slate-500">
        <Link href="/" className="hover:text-slate-900 transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="font-semibold text-slate-900">Contact & Hours</span>
      </nav>

      <div className="border-b border-slate-200 pb-6">
        <span className="text-xs font-bold uppercase tracking-wider text-sky-600 block mb-1">
          Direct Commercial Dispatch
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Contact Pinnacle Distributing
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-2xl leading-relaxed">
          Reach our logistics and sales teams directly for custom corrugated carton manufacturing, pallet stretch film volume agreements, and facility maintenance chemicals.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Direct Contact Info & Maps (Dynamic DB Grounded) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
            <h2 className="text-base font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
              Distribution Facility Info
            </h2>

            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <strong className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Warehouse Address
                  </strong>
                  <p className="text-slate-800 font-medium mt-0.5">{settings.address}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a11.042 11.042 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <strong className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Commercial Sales Line
                  </strong>
                  <p className="text-slate-800 font-bold text-base mt-0.5">{settings.contactPhone}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <strong className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Support & Orders Email
                  </strong>
                  <a
                    href={`mailto:${settings.contactEmail}`}
                    className="text-sky-600 hover:text-sky-700 font-medium mt-0.5 block"
                  >
                    {settings.contactEmail}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-3 border-t border-slate-100">
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <strong className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Hours:
                  </strong>
                  <p className="text-slate-800 font-medium mt-0.5 font-mono text-xs">{settings.hours || settings.businessHours}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Google Maps Embed (Dynamic DB Grounded) */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Warehouse Dispatch Map
              </span>
              <span className="text-[10px] font-mono text-slate-400">Dallas Facility</span>
            </div>

            <div className="aspect-video w-full bg-slate-100 relative">
              {settings.mapEmbedUrl ? (
                <div
                  className="w-full h-full"
                  dangerouslySetInnerHTML={{
                    __html: `<iframe title="Pinnacle Distributing Warehouse Location" src="${settings.mapEmbedUrl}" class="w-full h-full border-0" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`,
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
                  <svg className="w-10 h-10 mb-2 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-xs font-bold text-slate-700">Map location available upon appointment</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs">{settings.address}</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 text-xs font-bold text-sky-600 hover:text-sky-700 underline"
                  >
                    Open in Google Maps →
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Contact Inquiry Form */}
        <div className="lg:col-span-7">
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
