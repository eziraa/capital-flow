import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { canManageUsers } from "@/lib/permissions";

import { UsersManagementClient } from "./UsersManagementClient";

export const metadata: Metadata = { title: "Users — Capital Opportunities Tracker" };

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!canManageUsers(session.user.role)) redirect("/");

  return <UsersManagementClient currentUserId={session.user.id} />;
}
