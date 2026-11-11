"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";
import { Suspense } from "react";

function LogoutContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "";
  const [status, setStatus] = useState<"signing_out" | "completed">("signing_out");

  useEffect(() => {
    let active = true;

    async function performSignOut() {
      try {
        await fetch("/api/auth/signout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ callbackUrl: callbackUrl || "/login?signedOut=true" }),
        });
      } catch {
        // Ignore network errors and ensure client session clears
      }

      try {
        await signOut({ redirect: false });
      } catch {
        // Ignore if NextAuth client state already cleared
      }

      if (!active) return;
      setStatus("completed");

      const target = callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/login?signedOut=true";
      const timer = setTimeout(() => {
        window.location.replace(target);
      }, 900);

      return () => clearTimeout(timer);
    }

    performSignOut();
    return () => {
      active = false;
    };
  }, [callbackUrl]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex flex-col items-center group">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl bg-sky-600 text-white font-black text-2xl shadow-lg mb-4 group-hover:bg-sky-500 transition-colors">
            P
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            PINNACLE DISTRIBUTING
          </h1>
        </Link>
        <p className="mt-2 text-xs font-mono tracking-widest text-slate-400 uppercase">
          Secure Session Sign Out
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-700 text-center space-y-6">
          {status === "signing_out" ? (
            <>
              <div className="w-12 h-12 rounded-full bg-sky-500/15 border border-sky-500/30 flex items-center justify-center mx-auto">
                <svg
                  className="w-6 h-6 text-sky-400 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Signing You Out...</h2>
                <p className="mt-1 text-sm text-slate-300">
                  Securely ending your wholesale portal session.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <svg
                  className="w-6 h-6 text-emerald-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">You Have Signed Out</h2>
                <p className="mt-1 text-sm text-slate-300">
                  Your session has been securely terminated. Redirecting...
                </p>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/login"
                  className="flex-1 inline-flex justify-center py-2.5 px-4 rounded-lg text-sm font-bold text-white bg-sky-600 hover:bg-sky-500 transition-colors"
                >
                  Sign Back In
                </Link>
                <Link
                  href="/"
                  className="flex-1 inline-flex justify-center py-2.5 px-4 rounded-lg text-sm font-semibold text-slate-200 bg-slate-700 hover:bg-slate-600 transition-colors"
                >
                  Storefront Home
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LogoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-300 text-sm">
          Signing out...
        </div>
      }
    >
      <LogoutContent />
    </Suspense>
  );
}
