"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function RegisterFormClient({
  callbackUrl = "",
}: {
  callbackUrl?: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify your password.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          confirmPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      // Auto-sign-in immediately after registration for seamless flow
      const loginRes = await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          ...(callbackUrl ? { callbackUrl } : {}),
        }),
      });
      const loginData = await loginRes.json().catch(() => null);

      if (loginRes.ok && loginData?.success) {
        setSuccess("Account created! Signing you into your wholesale portal...");
        window.location.assign(loginData.url || callbackUrl || "/account");
        return;
      }

      setSuccess("Account created successfully! Redirecting to sign in...");
      const loginHref = callbackUrl
        ? `/login?registered=true&callbackUrl=${encodeURIComponent(callbackUrl)}`
        : "/login?registered=true";
      window.location.assign(loginHref);
    } catch (err: any) {
      setError(err.message || "Registration failed. Please try again.");
      setLoading(false);
    }
  };

  const loginHref = callbackUrl
    ? `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : "/login";

  return (
    <>
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-950/80 border border-red-800/80 text-red-200 text-sm font-medium">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 rounded-lg bg-emerald-950/80 border border-emerald-800/80 text-emerald-200 text-sm font-medium">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="name"
            className="block text-sm font-semibold text-slate-200 mb-1"
          >
            Full Name / Company Name
          </label>
          <input
            type="text"
            name="name"
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            placeholder="e.g. Acme Industrial Supply"
            className="block w-full rounded-lg border-slate-600 bg-slate-950 text-white placeholder-slate-500 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm px-4 py-3 border transition"
          />
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-semibold text-slate-200 mb-1"
          >
            Work Email Address
          </label>
          <input
            type="email"
            name="email"
            id="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="purchasing@company.com"
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
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="••••••••••••"
            className="block w-full rounded-lg border-slate-600 bg-slate-950 text-white placeholder-slate-500 shadow-sm focus:border-sky-500 focus:ring-sky-500 sm:text-sm px-4 py-3 border transition font-mono"
          />
          <p className="mt-1 text-xs text-slate-400">Minimum 6 characters.</p>
        </div>

        <div>
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-semibold text-slate-200 mb-1"
          >
            Confirm Password
          </label>
          <input
            type="password"
            name="confirmPassword"
            id="confirmPassword"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
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
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </div>
      </form>

      <div className="mt-6 border-t border-slate-700 pt-4 flex items-center justify-between text-xs">
        <Link
          href={loginHref}
          className="text-sky-400 hover:text-sky-300 font-medium transition"
        >
          Already have an account? Sign In →
        </Link>
        <Link
          href="/"
          className="text-slate-400 hover:text-slate-200 transition"
        >
          Return Home
        </Link>
      </div>
    </>
  );
}
