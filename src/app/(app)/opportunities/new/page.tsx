import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { OpportunityForm } from "@/components/opportunities/OpportunityForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { canCreateOpportunity } from "@/lib/permissions";

export const metadata: Metadata = { title: "New opportunity — Capital Opportunities Tracker" };

export default async function NewOpportunityPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!canCreateOpportunity(session.user.role)) redirect("/opportunities");

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>New opportunity</CardTitle>
          <CardDescription>Record a funding opportunity submitted by a company.</CardDescription>
        </CardHeader>
        <CardContent>
          <OpportunityForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
