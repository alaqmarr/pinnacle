import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LoginFormClient from "./LoginFormClient";

export const dynamic = "force-dynamic";

interface LoginPageProps {
  searchParams?: Promise<{
    callbackUrl?: string;
    error?: string;
    setup?: string;
    registered?: string;
    signedOut?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const [session, search, adminCount] = await Promise.all([
    getAuthSession(),
    searchParams ? searchParams : Promise.resolve({} as Record<string, string | undefined>),
    prisma.user.count({ where: { role: "ADMIN" } }).catch(() => 1),
  ]);

  const callbackUrl = search.callbackUrl || "";

  let redirectUrl = "";
  if (session?.user?.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });
    if (dbUser) {
      const defaultDest =
        dbUser.role === "ADMIN"
          ? "/admin"
          : dbUser.role === "MARKETING"
          ? "/admin/marketing"
          : "/account";

      if (callbackUrl && callbackUrl.startsWith("/") && !callbackUrl.startsWith("/login")) {
        if (dbUser.role === "CUSTOMER" && callbackUrl.startsWith("/admin")) {
          redirectUrl = "/account";
        } else if (
          dbUser.role === "MARKETING" &&
          callbackUrl.startsWith("/admin") &&
          !callbackUrl.startsWith("/admin/marketing")
        ) {
          redirectUrl = "/admin/marketing";
        } else {
          redirectUrl = callbackUrl;
        }
      } else {
        redirectUrl = defaultDest;
      }
    }
  }

  if (redirectUrl) {
    redirect(redirectUrl);
  }

  const errorParam = search.error || "";
  const isSetupSuccess = search.setup === "success";
  const isRegisteredSuccess = search.registered === "true";
  const isSignedOut = search.signedOut === "true";

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
          Wholesale Portal Sign In
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-700">
          <div className="border-b border-slate-700 pb-4 mb-6">
            <h2 className="text-xl font-bold text-white">Account Sign In</h2>
            <p className="mt-1 text-sm text-slate-300">
              Sign in to manage wholesale orders, saved shipping details, or administrative operations.
            </p>
          </div>

          {isSetupSuccess && (
            <div className="mb-6 p-4 rounded-lg bg-emerald-950/80 border border-emerald-800/80 text-emerald-200 text-sm font-medium">
              Initial administrator setup complete. Please sign in with your administrator credentials.
            </div>
          )}

          {isRegisteredSuccess && (
            <div className="mb-6 p-4 rounded-lg bg-emerald-950/80 border border-emerald-800/80 text-emerald-200 text-sm font-medium">
              Account created successfully. Please sign in below.
            </div>
          )}

          {isSignedOut && !isSetupSuccess && !isRegisteredSuccess && (
            <div className="mb-6 p-4 rounded-lg bg-sky-950/80 border border-sky-800/80 text-sky-200 text-sm font-medium">
              You have been securely signed out of your account.
            </div>
          )}

          <LoginFormClient
            callbackUrl={callbackUrl}
            errorParam={errorParam}
            setupAvailable={adminCount === 0}
          />
        </div>
      </div>
    </div>
  );
}
