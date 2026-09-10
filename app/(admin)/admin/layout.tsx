import React from "react";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import AdminShell from "@/components/admin/AdminShell";

export const metadata = {
  title: "Admin Portal | Pinnacle Distributing",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAuthSession();

  if (!session || !session.user || (session.user.role !== "ADMIN" && session.user.role !== "MARKETING")) {
    redirect("/login?callbackUrl=/admin");
  }

  return <AdminShell user={session.user}>{children}</AdminShell>;
}
