"use client";

import React, { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginFormClient({ callbackUrl, errorParam }: { callbackUrl: string, errorParam: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const fallback = callbackUrl || "/admin";
      const absoluteCallbackUrl = fallback.startsWith("http") 
        ? fallback 
        : `${window.location.origin}${fallback.startsWith("/") ? fallback : `/${fallback}`}`;

      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl: absoluteCallbackUrl,
      });

      if (res?.error) {
        setError("Invalid email or password. Please verify your credentials and try again.");
        setLoading(false);
      } else {
        // Use full page reload to ensure auth state is completely synchronized
        // and avoid any Next.js App Router client-side transition anomalies.
        const dest = callbackUrl || "/admin";
        window.location.assign(dest);
      }
    } catch (err) {
      console.error("Login catch error:", err);
      setError(`An unexpected error occurred: ${err instanceof Error ? err.message : String(err)}`);
      setLoading(false);
    }
  };

  return (
    <>
      {errorParam && !error && (
        <div className="mb-6 p-4 rounded-lg bg-red-950/80 border border-red-800/80 text-red-200 text-sm font-medium">
          {errorParam === 'CredentialsSignin'
            ? 'Invalid email or password. Please verify your credentials and try again.'
            : 'Authentication failed. Please check your details and try again.'}
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-950/80 border border-red-800/80 text-red-200 text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-semibold text-slate-200 mb-1"
          >
            Email Address
          </label>
          <input
            type="email"
            name="email"
            id="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="user@pinnacle.com"
            className="block w-full rounded-lg border-slate-600 bg-slate-950 text-white placeholder-slate-500 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm px-4 py-3 border transition"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-semibold text-slate-200 mb-1"
          >
            Password
          </label>
          <input
            type="password"
            name="password"
            id="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="••••••••••••"
            className="block w-full rounded-lg border-slate-600 bg-slate-950 text-white placeholder-slate-500 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm px-4 py-3 border transition font-mono"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-sky-600 hover:bg-sky-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition cursor-pointer disabled:opacity-50"
          >
            {loading ? "Verifying Credentials..." : "Sign In"}
          </button>
        </div>
      </form>

      <div className="mt-6 border-t border-slate-700 pt-4 flex flex-col space-y-3 text-xs">
        <div className="flex justify-between items-center">
          <Link
            href="/register"
            className="text-sky-400 hover:text-sky-300 font-medium transition"
          >
            Need an account? Register as Customer →
          </Link>
          <Link
            href="/setup"
            className="text-amber-400 hover:text-amber-300 font-medium transition"
          >
            System Setup
          </Link>
        </div>
        <div className="text-center pt-2">
          <Link
            href="/"
            className="text-slate-400 hover:text-slate-200 transition"
          >
            ← Return to Storefront Homepage
          </Link>
        </div>
      </div>
    </>
  );
}
