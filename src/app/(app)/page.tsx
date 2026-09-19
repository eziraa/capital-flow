import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getDashboardSummary } from "@/actions/dashboard";
import { auth } from "@/auth";

import { DashboardClient } from "./DashboardClient";

export const metadata: Metadata = { title: "Dashboard — Capital Opportunities Tracker" };

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const result = await getDashboardSummary();
  return <DashboardClient initial={result} />;
}
