import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import RegisterFormClient from "./RegisterFormClient";

export const dynamic = "force-dynamic";

interface RegisterPageProps {
  searchParams?: Promise<{
    callbackUrl?: string;
  }>;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const [session, search] = await Promise.all([
    getAuthSession(),
    searchParams ? searchParams : Promise.resolve({} as { callbackUrl?: string }),
  ]);

  const callbackUrl = search.callbackUrl || "";

  if (session?.user?.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    });
    if (dbUser) {
      if (dbUser.role === "ADMIN") redirect("/admin");
      if (dbUser.role === "MARKETING") redirect("/admin/marketing");
      redirect(callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/account");
    }
  }

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
          Wholesale Packaging &amp; Janitorial Solutions
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-700">
          <div className="border-b border-slate-700 pb-4 mb-6">
            <h2 className="text-xl font-bold text-white">
              Create Customer Account
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              Register for wholesale order management, cart persistence, and expedited checkout.
            </p>
          </div>

          <RegisterFormClient callbackUrl={callbackUrl} />
        </div>
      </div>
    </div>
  );
}
