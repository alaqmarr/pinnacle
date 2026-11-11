import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import SetupFormClient from "./SetupFormClient";

export const dynamic = "force-dynamic";

export default async function SetupPage() {
  const adminCount = await prisma.user.count({
    where: { role: "ADMIN" },
  });

  if (adminCount > 0) {
    redirect("/login");
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
        <p className="mt-2 text-xs font-mono tracking-widest text-amber-400 uppercase">
          System Administration Engine
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-slate-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-700">
          <div className="border-b border-slate-700/80 pb-5 mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
              One-Time Administrator Account Setup
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              Create the initial administrator account to manage Pinnacle Distributing. This gatekeeper automatically locks after the first administrator is registered.
            </p>
          </div>

          <SetupFormClient />
        </div>
      </div>
    </div>
  );
}
