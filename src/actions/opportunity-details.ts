"use server";

import { getActingUser } from "@/lib/acting-user";
import { type ActionResult, forbidden, notFound, ok, unauthenticated, unknownError, validationError } from "@/lib/action-result";
import { canEditOpportunity } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { opportunityUpdateSchema, type OpportunityUpdateInput } from "@/lib/validation/opportunity-update";
import { fieldErrorsFrom } from "@/lib/zod-errors";

export async function updateOpportunityDetails(
  input: OpportunityUpdateInput,
): Promise<ActionResult<{ id: string }>> {
  const user = await getActingUser();
  if (!user) return unauthenticated();

  const parsed = opportunityUpdateSchema.safeParse(input);
  if (!parsed.success) return validationError(fieldErrorsFrom(parsed.error));

  const { id, priority, tags, deadline } = parsed.data;

  try {
    const existing = await prisma.opportunity.findUnique({ where: { id } });
    if (!existing) return notFound();
    if (!canEditOpportunity(user.role)) return forbidden("Only admins and reviewers can edit details.");

    await prisma.opportunity.update({
      where: { id },
      data: {
        ...(priority ? { priority } : {}),
        ...(tags ? { tags } : {}),
        ...(deadline !== undefined ? { deadline: deadline ? new Date(deadline) : null } : {}),
      },
    });

    return ok({ id });
  } catch (error) {
    console.error("updateOpportunityDetails failed", error);
    return unknownError();
  }
}

export async function updateOpportunityDetailsFormAction(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return updateOpportunityDetails({
    id: formData.get("id") as string,
    priority: formData.get("priority") as any,
    tags: formData.get("tags") ? (formData.get("tags") as string).split(",").map(s => s.trim()).filter(Boolean) : undefined,
    deadline: formData.get("deadline") as string || null,
  });
}
