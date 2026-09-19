import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getOpportunity } from "@/actions/opportunities";
import { auth } from "@/auth";
import { OpportunityForm } from "@/components/opportunities/OpportunityForm";
import { toDateInputValue } from "@/lib/format";
import { canEditOpportunity } from "@/lib/permissions";

export const metadata: Metadata = { title: "Edit opportunity — Capital Opportunities Tracker" };

export default async function EditOpportunityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!canEditOpportunity(session.user.role)) redirect("/opportunities");

  const { id } = await params;
  const result = await getOpportunity(id);
  if (!result.ok) {
    if (result.error.kind === "NOT_FOUND") notFound();
    throw new Error(result.error.message);
  }

  const opportunity = result.data;
  if (opportunity.archivedAt) redirect(`/opportunities/${id}`);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-lg font-semibold text-fg">Edit opportunity</h1>
      <p className="mb-6 text-sm text-muted">{opportunity.companyName}</p>
      <div className="rounded-lg border border-border bg-surface p-6 shadow-sm">
        <OpportunityForm
          mode="edit"
          opportunityId={id}
          initial={{
            companyName: opportunity.companyName,
            requestedAmount: String(opportunity.requestedAmount),
            currency: opportunity.currency,
            submissionDate: toDateInputValue(opportunity.submissionDate),
            description: opportunity.description,
          }}
        />
      </div>
    </div>
  );
}
