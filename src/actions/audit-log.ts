"use server";

import type { ActivityType } from "@prisma/client";

import { getActingUser } from "@/lib/acting-user";
import { type ActionResult, forbidden, ok, unauthenticated, unknownError } from "@/lib/action-result";
import { describeActivity } from "@/lib/activity-description";
import { toActivityDTO, type ActivityDTO } from "@/lib/dto";
import { canExportActivity } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export type ActivityExport = { csv: string; filename: string };

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export type ActivityLogPage = {
  items: (ActivityDTO & { companyName: string; opportunityId: string })[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

const LOG_PAGE_SIZE = 20;

export type AuditLogQuery = {
  page?: number;
  type?: ActivityType | "ALL";
  actorId?: string;
  dateFrom?: string;
  dateTo?: string;
};

/** Admin-only: paginated cross-opportunity activity log for the audit log page. */
export async function listActivityLog(query: AuditLogQuery = {}): Promise<ActionResult<ActivityLogPage>> {
  const actingUser = await getActingUser();
  if (!actingUser) return unauthenticated();
  if (!canExportActivity(actingUser.role)) return forbidden("Only admins can view the audit log.");

  const page = Math.max(1, query.page ?? 1);

  try {
    const where = {
      ...(query.type && query.type !== "ALL" ? { type: query.type } : {}),
      ...(query.actorId ? { actorId: query.actorId } : {}),
      ...(query.dateFrom || query.dateTo
        ? {
            createdAt: {
              ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
              ...(query.dateTo ? { lte: new Date(query.dateTo + "T23:59:59Z") } : {}),
            },
          }
        : {}),
    };

    const [total, activities] = await Promise.all([
      prisma.activity.count({ where }),
      prisma.activity.findMany({
        where,
        include: {
          opportunity: { select: { id: true, companyName: true } },
          actor: true,
          previousReviewer: true,
          newReviewer: true,
          comment: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * LOG_PAGE_SIZE,
        take: LOG_PAGE_SIZE,
      }),
    ]);

    const pageCount = Math.max(1, Math.ceil(total / LOG_PAGE_SIZE));

    return ok({
      items: activities.map((a) => ({
        ...toActivityDTO(a),
        companyName: a.opportunity.companyName,
        opportunityId: a.opportunity.id,
      })),
      total,
      page,
      pageSize: LOG_PAGE_SIZE,
      pageCount,
    });
  } catch (error) {
    console.error("listActivityLog failed", error);
    return unknownError();
  }
}

/**
 * Admin-only CSV export of the full, cross-opportunity activity log — the
 * assignment's own "audit-log export" optional enhancement, built on the
 * same append-only Activity model and description logic the per-opportunity
 * timeline already uses.
 */
export async function exportActivityCsv(): Promise<ActionResult<ActivityExport>> {
  const actingUser = await getActingUser();
  if (!actingUser) return unauthenticated();
  if (!canExportActivity(actingUser.role)) return forbidden("Only admins can export the activity log.");

  try {
    const activities = await prisma.activity.findMany({
      include: {
        opportunity: { select: { companyName: true } },
        actor: true,
        previousReviewer: true,
        newReviewer: true,
        comment: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const header = ["Timestamp", "Company", "Type", "Actor", "Details"];
    const rows = activities.map((activity) => [
      activity.createdAt.toISOString(),
      activity.opportunity.companyName,
      activity.type,
      activity.actor.name,
      describeActivity(toActivityDTO(activity)),
    ]);

    const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");

    return ok({ csv, filename: `activity-log-${new Date().toISOString().slice(0, 10)}.csv` });
  } catch (error) {
    console.error("exportActivityCsv failed", error);
    return unknownError();
  }
}
