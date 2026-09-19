import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { OpportunityForm } from "@/components/opportunities/OpportunityForm";
import { canCreateOpportunity } from "@/lib/permissions";

export const metadata: Metadata = { title: "New opportunity — Capital Opportunities Tracker" };

export default async function NewOpportunityPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!canCreateOpportunity(session.user.role)) redirect("/opportunities");

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-lg font-semibold text-fg">New opportunity</h1>
      <p className="mb-6 text-sm text-muted">Record a funding opportunity submitted by a company.</p>
      <div className="rounded-lg border border-border bg-surface p-6 shadow-sm">
        <OpportunityForm mode="create" />
      </div>
    </div>
  );
}
