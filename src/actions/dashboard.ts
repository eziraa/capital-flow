"use server";

import { Stage, type Currency } from "@prisma/client";

import { getActingUser } from "@/lib/acting-user";
import { type ActionResult, ok, unauthenticated, unknownError } from "@/lib/action-result";
import { toOpportunityListItem, type OpportunityListItem } from "@/lib/dto";
import { prisma } from "@/lib/prisma";

export type DashboardSummary = {
  totalActive: number;
  stageCounts: Record<Stage, number>;
  amountByCurrency: { currency: Currency; total: number }[];
  recentOpportunities: OpportunityListItem[];
  reviewerWorkload: { id: string; name: string; activeCount: number }[];
};

const ACTIVE_FILTER = { archivedAt: null } as const;

/**
 * Everything the dashboard needs, computed directly from PostgreSQL.
 * "Active" throughout means not archived — archived opportunities are
 * excluded from every total here, consistent with the list/archive rules.
 */
export async function getDashboardSummary(): Promise<ActionResult<DashboardSummary>> {
  const user = await getActingUser();
  if (!user) return unauthenticated();

  try {
    const [totalActive, stageGroups, amountGroups, recent, reviewers, reviewerGroups] =
      await Promise.all([
        prisma.opportunity.count({ where: ACTIVE_FILTER }),
        prisma.opportunity.groupBy({
          by: ["stage"],
          where: ACTIVE_FILTER,
          _count: { _all: true },
        }),
        prisma.opportunity.groupBy({
          by: ["currency"],
          where: ACTIVE_FILTER,
          _sum: { requestedAmount: true },
        }),
        prisma.opportunity.findMany({
          where: ACTIVE_FILTER,
          include: { reviewer: true },
          orderBy: { submissionDate: "desc" },
          take: 5,
        }),
        prisma.user.findMany({
          where: { role: "REVIEWER" },
          select: { id: true, name: true },
          orderBy: { name: "asc" },
        }),
        prisma.opportunity.groupBy({
          by: ["reviewerId"],
          where: { ...ACTIVE_FILTER, reviewerId: { not: null } },
          _count: { _all: true },
        }),
      ]);

    const stageCounts = Object.fromEntries(Object.values(Stage).map((stage) => [stage, 0])) as Record<
      Stage,
      number
    >;
    for (const group of stageGroups) {
      stageCounts[group.stage] = group._count._all;
    }

    const amountByCurrency = amountGroups.map((group) => ({
      currency: group.currency,
      total: group._sum.requestedAmount?.toNumber() ?? 0,
    }));

    const workloadByReviewerId = new Map(reviewerGroups.map((g) => [g.reviewerId, g._count._all]));
    const reviewerWorkload = reviewers.map((reviewer) => ({
      id: reviewer.id,
      name: reviewer.name,
      activeCount: workloadByReviewerId.get(reviewer.id) ?? 0,
    }));

    return ok({
      totalActive,
      stageCounts,
      amountByCurrency,
      recentOpportunities: recent.map(toOpportunityListItem),
      reviewerWorkload,
    });
  } catch (error) {
    console.error("getDashboardSummary failed", error);
    return unknownError();
  }
}
