import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";

import { OpportunitiesListClient } from "./OpportunitiesListClient";

export const metadata: Metadata = { title: "Opportunities — Capital Opportunities Tracker" };

export default async function OpportunitiesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return <OpportunitiesListClient role={session.user.role} />;
}
