"use server";

import { getActingUser } from "@/lib/acting-user";
import { type ActionResult, forbidden, ok, unauthenticated, unknownError } from "@/lib/action-result";
import { describeActivity } from "@/lib/activity-description";
import { toActivityDTO } from "@/lib/dto";
import { canExportActivity } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export type ActivityExport = { csv: string; filename: string };

function csvCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
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
