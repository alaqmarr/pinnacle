"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface MarketingClientProps {
  initialHeadScripts: string;
  initialBodyTopScripts: string;
  userRole: string;
}

export default function MarketingClient({
  initialHeadScripts,
  initialBodyTopScripts,
  userRole,
}: MarketingClientProps) {
  const router = useRouter();

  const [headScripts, setHeadScripts] = useState(initialHeadScripts);
  const [bodyTopScripts, setBodyTopScripts] = useState(initialBodyTopScripts);

  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error" | null;
    message: string;
  }>({ type: null, message: "" });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatus({ type: null, message: "" });

    try {
      const res = await fetch("/api/admin/marketing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headScripts,
          bodyTopScripts,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to save marketing scripts");
      }

      setStatus({
        type: "success",
        message: "Marketing scripts saved to database and storefront layout cache revalidated.",
      });

      router.refresh();
    } catch (err: any) {
      setStatus({
        type: "error",
        message: err.message || "Network error while saving scripts",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleInsertGtmTemplate = () => {
    setHeadScripts(
      `<!-- Google Tag Manager -->\n<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':\nnew Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],\nj=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=\n'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);\n})(window,document,'script','dataLayer','GTM-PINNACLE');</script>\n<!-- End Google Tag Manager -->`
    );
    setBodyTopScripts(
      `<!-- Google Tag Manager (noscript) -->\n<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-PINNACLE"\nheight="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>\n<!-- End Google Tag Manager (noscript) -->`
    );
  };

  const handleInsertGa4Template = () => {
    setHeadScripts(
      `<!-- Google tag (gtag.js) -->\n<script async src="https://www.googletagmanager.com/gtag/js?id=G-PINNACLE123"></script>\n<script>\n  window.dataLayer = window.dataLayer || [];\n  function gtag(){dataLayer.push(arguments);}\n  gtag('js', new Date());\n  gtag('config', 'G-PINNACLE123');\n</script>`
    );
  };

  const handleClearAll = () => {
    if (window.confirm("Clear all marketing scripts? This will remove custom tracking on the storefront.")) {
      setHeadScripts("");
      setBodyTopScripts("");
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Marketing Script Injection
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage Google Tag Manager, Google Analytics 4, Meta Pixel, and custom tracking scripts.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            Role: {userRole}
          </span>
        </div>
      </div>

      {/* Info Callout */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 shadow-md">
        <div className="flex items-start space-x-3">
          <div className="p-1.5 bg-purple-500/20 text-purple-400 rounded-lg shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <div className="text-xs space-y-1">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Storefront Injection Architecture
            </h3>
            <p className="text-slate-300 leading-relaxed">
              Scripts entered here are saved into the SQLite database and injected directly into the storefront’s Root Layout (<code className="text-purple-300 font-mono">app/layout.tsx</code>) via raw <code className="text-purple-300 font-mono">dangerouslySetInnerHTML</code>.
            </p>
            <p className="text-slate-400">
              • <strong>Head Scripts:</strong> Injected directly inside the <code className="text-purple-300 font-mono">&lt;head&gt;</code> element of all storefront pages.<br />
              • <strong>Body Top Scripts:</strong> Injected immediately after the opening <code className="text-purple-300 font-mono">&lt;body&gt;</code> tag before any storefront components render.
            </p>
          </div>
        </div>
      </div>

      {/* Status Feedback Banner */}
      {status.type && (
        <div
          className={`p-4 rounded-xl border text-sm font-medium flex items-center justify-between shadow-xs ${
            status.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center space-x-2">
            {status.type === "success" ? (
              <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-red-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span>{status.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatus({ type: null, message: "" })}
            className="text-xs font-bold underline ml-4 hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Quick Templates Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Quick Insert Templates:
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleInsertGtmTemplate}
            className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors"
          >
            Google Tag Manager (GTM)
          </button>
          <button
            type="button"
            onClick={handleInsertGa4Template}
            className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors"
          >
            Google Analytics 4 (GA4)
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Head Scripts Editor */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <label htmlFor="head-scripts-input" className="block text-sm font-bold text-slate-900">
              Storefront &lt;head&gt; Scripts
            </label>
            <p className="text-xs text-slate-500 mt-0.5">
              Injected directly into the document <code className="text-sky-600 font-mono">&lt;head&gt;</code> on all public storefront pages. Include opening and closing <code className="text-sky-600 font-mono">&lt;script&gt;</code> or <code className="text-sky-600 font-mono">&lt;meta&gt;</code> tags.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {headScripts.length} chars
          </span>
        </div>
        <textarea
          id="head-scripts-input"
          rows={8}
          value={headScripts}
          onChange={(e) => setHeadScripts(e.target.value)}
          placeholder={`<!-- Example: Google Tag Manager -->\n<script>\n  (function(w,d,s,l,i){...})(window,document,'script','dataLayer','GTM-XXXX');\n</script>`}
          className="w-full font-mono text-xs sm:text-sm p-4 bg-slate-950 text-emerald-400 rounded-lg border border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed"
          spellCheck={false}
        />
      </div>

      {/* Body Top Scripts Editor */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <label htmlFor="body-top-scripts-input" className="block text-sm font-bold text-slate-900">
              Storefront &lt;body&gt; Top Scripts
            </label>
            <p className="text-xs text-slate-500 mt-0.5">
              Injected at the immediate top of the document <code className="text-sky-600 font-mono">&lt;body&gt;</code> before layout content. Standard for Google Tag Manager <code className="text-sky-600 font-mono">&lt;noscript&gt;</code> fallback iframes.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {bodyTopScripts.length} chars
          </span>
        </div>
        <textarea
          id="body-top-scripts-input"
          rows={6}
          value={bodyTopScripts}
          onChange={(e) => setBodyTopScripts(e.target.value)}
          placeholder={`<!-- Example: GTM (noscript) -->\n<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXX"\nheight="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`}
          className="w-full font-mono text-xs sm:text-sm p-4 bg-slate-950 text-emerald-400 rounded-lg border border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed"
          spellCheck={false}
        />
      </div>

      {/* Form Submission */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <span className="text-xs text-slate-500">
          Saved scripts will immediately execute on all storefront page visits.
        </span>
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center px-6 py-2.5 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 active:bg-purple-800 rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Saving Scripts...
            </>
          ) : (
            "Save Marketing Scripts"
          )}
        </button>
      </div>
    </form>
  );
}
