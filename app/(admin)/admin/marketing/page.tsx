import React from "react";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MarketingClient from "./MarketingClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Marketing & Script Injection | Pinnacle Admin",
};

export default async function AdminMarketingPage() {
  const session = await getAuthSession();
  if (!session || !session.user || (session.user.role !== "ADMIN" && session.user.role !== "MARKETING")) {
    redirect("/login?callbackUrl=/admin/marketing");
  }

  const settings = await prisma.globalSetting.findUnique({
    where: { id: "singleton" },
    select: {
      headScripts: true,
      bodyTopScripts: true,
    },
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <MarketingClient
        initialHeadScripts={settings?.headScripts || ""}
        initialBodyTopScripts={settings?.bodyTopScripts || ""}
        userRole={session.user.role}
      />
    </div>
  );
}
