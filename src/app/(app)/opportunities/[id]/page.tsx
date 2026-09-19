import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getOpportunity } from "@/actions/opportunities";
import { auth } from "@/auth";

import { OpportunityDetailClient } from "./OpportunityDetailClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const result = await getOpportunity(id);
  return { title: result.ok ? `${result.data.companyName} — Capital Opportunities Tracker` : "Opportunity" };
}

export default async function OpportunityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const result = await getOpportunity(id);

  if (!result.ok) {
    if (result.error.kind === "NOT_FOUND") notFound();
    throw new Error(result.error.message);
  }

  return <OpportunityDetailClient id={id} role={session.user.role} initial={result.data} />;
}
