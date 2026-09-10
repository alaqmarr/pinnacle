import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LoginFormClient from "./LoginFormClient";

interface LoginPageProps {
  searchParams?: Promise<{
    callbackUrl?: string;
    error?: string;
    setup?: string;
    registered?: string;
  }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await getServerSession(authOptions);
  const search = (await searchParams) || {};
  const callbackUrl = search.callbackUrl || "";

  let redirectUrl = "";
  if (session?.user?.email) {
    // Check if user still exists in DB to prevent infinite redirect loops on DB resets
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true }
    });
    if (dbUser) {
      redirectUrl = callbackUrl || (dbUser.role === "ADMIN" ? "/admin" : "/");
    }
  }

  if (redirectUrl) {
    redirect(redirectUrl);
  }

  const errorParam = search.error || "";
  const isSetupSuccess = search.setup === "success";
  const isRegisteredSuccess = search.registered === "true";

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl bg-sky-600 text-white font-black text-2xl shadow-lg mb-4">
          P
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          PINNACLE DISTRIBUTING
        </h1>
        <p className="mt-2 text-xs font-mono tracking-widest text-slate-400 uppercase">
          Wholesale Portal Sign In
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-700">
          <div className="border-b border-slate-700 pb-4 mb-6">
            <h2 className="text-xl font-bold text-white">Account Sign In</h2>
            <p className="mt-1 text-sm text-slate-300">
              Enter your credentials to access your administrative dashboard or wholesale account.
            </p>
          </div>

          {isSetupSuccess && (
            <div className="mb-6 p-4 rounded-lg bg-emerald-950/80 border border-emerald-800/80 text-emerald-200 text-sm font-medium">
              ✓ Initial administrator setup complete! Please sign in with your administrator credentials.
            </div>
          )}

          {isRegisteredSuccess && (
            <div className="mb-6 p-4 rounded-lg bg-emerald-950/80 border border-emerald-800/80 text-emerald-200 text-sm font-medium">
              ✓ Account registered successfully! You may now sign in below.
            </div>
          )}

          <LoginFormClient callbackUrl={callbackUrl} errorParam={errorParam} />
        </div>
      </div>
    </div>
  );
}
