import React from "react";
import FreightClient from "./FreightClient";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminFreightPage() {
  const methods = await prisma.freightMethod.findMany({
    orderBy: { cost: "asc" }
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Freight Methods</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage the shipping options and costs presented to customers at checkout.
        </p>
      </div>

      <FreightClient initialMethods={methods} />
    </div>
  );
}
