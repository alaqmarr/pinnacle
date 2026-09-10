import React from "react";
import { prisma } from "@/lib/prisma";
import InquiriesClient from "./InquiriesClient";

export const dynamic = "force-dynamic";

export default async function AdminInquiriesPage() {
  const inquiries = await prisma.contactInquiry.findMany({
    orderBy: { createdAt: "desc" },
  });

  const formatted = inquiries.map((inq) => ({
    id: inq.id,
    name: inq.name,
    email: inq.email,
    phone: inq.phone || "",
    message: inq.message,
    status: inq.status,
    createdAt: inq.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          Commercial Contact Inquiries
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Inbound requests for bulk quotes, custom packaging specs, and facility delivery scheduling.
        </p>
      </div>

      <InquiriesClient initialInquiries={formatted} />
    </div>
  );
}
