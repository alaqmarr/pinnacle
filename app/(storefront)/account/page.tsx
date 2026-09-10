import React from "react";
import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AccountClient from "./AccountClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Account | Pinnacle Distributing",
  description: "View and manage your account information, commercial wholesale privileges, saved addresses, and order history.",
};

export default async function AccountPage() {
  const session = await getAuthSession();
  if (!session || !session.user || !session.user.id) {
    redirect("/login?callbackUrl=/account");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      allowCredit: true,
      allowPickup: true,
      createdAt: true,
      addresses: {
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
      },
      orders: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          paymentStatus: true,
          total: true,
          createdAt: true,
          _count: { select: { items: true } },
        },
      },
    },
  });

  if (!user) {
    redirect("/login?callbackUrl=/account");
  }

  const serializedUser = {
    ...user,
    createdAt: user.createdAt.toISOString(),
    addresses: user.addresses.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    })),
    orders: user.orders.map((o) => ({
      ...o,
      createdAt: o.createdAt.toISOString(),
    })),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <AccountClient user={serializedUser} />
    </div>
  );
}
