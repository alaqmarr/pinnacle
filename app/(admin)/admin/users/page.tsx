import React from "react";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import UsersClient from "./UsersClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "User Management & RBAC | Pinnacle Distributing Admin",
};

export default async function AdminUsersPage() {
  const session = await getAuthSession();
  if (!session || !session.user || session.user.role !== "ADMIN") {
    redirect("/admin");
  }

  const rawUsers = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      allowCredit: true,
      allowPickup: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: { orders: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Serialize dates for client components
  const users = rawUsers.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
    updatedAt: u.updatedAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <UsersClient initialUsers={users} currentUserId={session.user.id} />
    </div>
  );
}
