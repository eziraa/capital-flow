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
  submissionsTrend: { month: string; count: number }[];
};

const ACTIVE_FILTER = { archivedAt: null } as const;

export async function getDashboardSummary(): Promise<ActionResult<DashboardSummary>> {
  const user = await getActingUser();
  if (!user) return unauthenticated();

  try {
    const [totalActive, stageGroups, amountGroups, recent, reviewers, reviewerGroups, rawTrend] =
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
        // Get all dates to group them in TS since Prisma SQLite/PG date grouping is dialect-specific
        prisma.opportunity.findMany({
          where: ACTIVE_FILTER,
          select: { submissionDate: true },
          orderBy: { submissionDate: "asc" },
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

    // Group trend by YYYY-MM
    const trendMap = new Map<string, number>();
    for (const item of rawTrend) {
      const month = item.submissionDate.toISOString().slice(0, 7);
      trendMap.set(month, (trendMap.get(month) ?? 0) + 1);
    }
    const submissionsTrend = Array.from(trendMap.entries())
      .map(([month, count]) => ({ month, count }))
      .slice(-6); // Last 6 months

    return ok({
      totalActive,
      stageCounts,
      amountByCurrency,
      recentOpportunities: recent.map(toOpportunityListItem),
      reviewerWorkload,
      submissionsTrend,
    });
  } catch (error) {
    console.error("getDashboardSummary failed", error);
    return unknownError();
  }
}
