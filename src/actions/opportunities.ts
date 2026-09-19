"use server";

import type { Prisma } from "@prisma/client";

import { getActingUser } from "@/lib/acting-user";
import {
  type ActionResult,
  conflict,
  forbidden,
  notFound,
  ok,
  unauthenticated,
  unknownError,
  validationError,
} from "@/lib/action-result";
import { toOpportunityDetail, toOpportunityListItem, type OpportunityDetail, type OpportunityListItem } from "@/lib/dto";
import { canCreateOpportunity, canEditOpportunity } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import {
  type CreateOpportunityInput,
  createOpportunitySchema,
  type UpdateOpportunityInput,
  updateOpportunitySchema,
} from "@/lib/validation/opportunity";
import {
  type OpportunityListQuery,
  opportunityListQuerySchema,
  PAGE_SIZE,
} from "@/lib/validation/opportunity-query";
import { fieldErrorsFrom } from "@/lib/zod-errors";

export type OpportunityListResult = {
  items: OpportunityListItem[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

function buildWhere(query: OpportunityListQuery): Prisma.OpportunityWhereInput {
  const where: Prisma.OpportunityWhereInput = {};

  if (query.archived === "ACTIVE") {
    where.archivedAt = null;
  } else if (query.archived === "ARCHIVED") {
    where.archivedAt = { not: null };
  }

  if (query.stage !== "ALL") {
    where.stage = query.stage;
  }

  if (query.q) {
    where.companyName = { contains: query.q, mode: "insensitive" };
  }

  if (query.currency !== "ALL") {
    where.currency = query.currency;
  }

  if (query.dateFrom || query.dateTo) {
    where.submissionDate = {
      ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
      ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
    };
  }

  if (query.amountMin !== undefined || query.amountMax !== undefined) {
    where.requestedAmount = {
      ...(query.amountMin !== undefined ? { gte: query.amountMin } : {}),
      ...(query.amountMax !== undefined ? { lte: query.amountMax } : {}),
    };
  }

  return where;
}

/**
 * Reads the opportunities list. Called from the client as an SWR fetcher —
 * search, filtering, sorting, and pagination all happen in this Prisma
 * query, never in the browser.
 */
export async function listOpportunities(
  rawQuery: OpportunityListQuery,
): Promise<ActionResult<OpportunityListResult>> {
  const user = await getActingUser();
  if (!user) return unauthenticated();

  const parsed = opportunityListQuerySchema.safeParse(rawQuery);
  if (!parsed.success) return validationError(fieldErrorsFrom(parsed.error));

  const query = parsed.data;
  const where = buildWhere(query);

  try {
    const total = await prisma.opportunity.count({ where });
    const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const page = Math.min(query.page, pageCount);

    const rows = await prisma.opportunity.findMany({
      where,
      include: { reviewer: true },
      orderBy: { [query.sort]: query.dir },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    });

    return ok({
      items: rows.map(toOpportunityListItem),
      total,
      page,
      pageSize: PAGE_SIZE,
      pageCount,
    });
  } catch (error) {
    console.error("listOpportunities failed", error);
    return unknownError();
  }
}

export async function getOpportunity(id: string): Promise<ActionResult<OpportunityDetail>> {
  const user = await getActingUser();
  if (!user) return unauthenticated();

  if (!id) return notFound();

  try {
    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
      include: { reviewer: true, createdBy: true },
    });

    if (!opportunity) return notFound();

    return ok(toOpportunityDetail(opportunity));
  } catch (error) {
    console.error("getOpportunity failed", error);
    return unknownError();
  }
}

export async function createOpportunity(
  input: CreateOpportunityInput,
): Promise<ActionResult<{ id: string }>> {
  const user = await getActingUser();
  if (!user) return unauthenticated();
  if (!canCreateOpportunity(user.role)) {
    return forbidden("Only admins can create opportunities.");
  }

  const parsed = createOpportunitySchema.safeParse(input);
  if (!parsed.success) return validationError(fieldErrorsFrom(parsed.error));

  const data = parsed.data;

  try {
    const opportunity = await prisma.$transaction(async (tx) => {
      const created = await tx.opportunity.create({
        data: {
          companyName: data.companyName,
          requestedAmount: data.requestedAmount,
          currency: data.currency,
          description: data.description,
          submissionDate: data.submissionDate,
          createdById: user.id,
        },
      });

      await tx.activity.create({
        data: {
          opportunityId: created.id,
          type: "CREATED",
          actorId: user.id,
        },
      });

      return created;
    });

    return ok({ id: opportunity.id });
  } catch (error) {
    console.error("createOpportunity failed", error);
    return unknownError();
  }
}

export async function updateOpportunity(
  input: UpdateOpportunityInput,
): Promise<ActionResult<{ id: string }>> {
  const user = await getActingUser();
  if (!user) return unauthenticated();
  if (!canEditOpportunity(user.role)) {
    return forbidden("Only admins can edit opportunities.");
  }

  const parsed = updateOpportunitySchema.safeParse(input);
  if (!parsed.success) return validationError(fieldErrorsFrom(parsed.error));

  const { id, ...data } = parsed.data;

  try {
    const existing = await prisma.opportunity.findUnique({ where: { id } });
    if (!existing) return notFound();
    if (existing.archivedAt) {
      return conflict("Archived opportunities cannot be edited. Restore it first.");
    }

    const updated = await prisma.opportunity.update({
      where: { id },
      data: {
        companyName: data.companyName,
        requestedAmount: data.requestedAmount,
        currency: data.currency,
        description: data.description,
        submissionDate: data.submissionDate,
      },
    });

    return ok({ id: updated.id });
  } catch (error) {
    console.error("updateOpportunity failed", error);
    return unknownError();
  }
}

function opportunityInputFromFormData(formData: FormData) {
  return {
    companyName: formData.get("companyName"),
    requestedAmount: formData.get("requestedAmount"),
    currency: formData.get("currency"),
    description: formData.get("description"),
    submissionDate: formData.get("submissionDate"),
  };
}

/** `useActionState`-compatible adapter for the create form. */
export async function createOpportunityFormAction(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return createOpportunity(opportunityInputFromFormData(formData) as unknown as CreateOpportunityInput);
}

/** `useActionState`-compatible adapter for the edit form. */
export async function updateOpportunityFormAction(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  return updateOpportunity({
    id: formData.get("id"),
    ...opportunityInputFromFormData(formData),
  } as unknown as UpdateOpportunityInput);
}
