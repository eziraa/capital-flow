"use server";

import * as XLSX from "xlsx";

import { getActingUser } from "@/lib/acting-user";
import { type ActionResult, forbidden, ok, unauthenticated, unknownError } from "@/lib/action-result";
import { prisma } from "@/lib/prisma";
import { canExportActivity } from "@/lib/permissions";

export async function exportOpportunitiesExcel(): Promise<ActionResult<{ base64: string; filename: string }>> {
  const user = await getActingUser();
  if (!user) return unauthenticated();
  
  // Reuse the same permission as activity export for now, or allow all users
  if (!canExportActivity(user.role)) return forbidden("Only admins can export data.");

  try {
    const opportunities = await prisma.opportunity.findMany({
      where: { archivedAt: null },
      include: {
        reviewer: true,
        createdBy: true,
      },
      orderBy: { submissionDate: "desc" },
    });

    const data = opportunities.map((opp) => ({
      ID: opp.id,
      Company: opp.companyName,
      "Requested Amount": Number(opp.requestedAmount),
      Currency: opp.currency,
      Stage: opp.stage,
      Priority: opp.priority,
      "Submission Date": opp.submissionDate.toISOString().split("T")[0],
      Tags: opp.tags.join(", "),
      Deadline: opp.deadline ? opp.deadline.toISOString().split("T")[0] : "",
      "Reviewer Name": opp.reviewer?.name ?? "Unassigned",
      "Created By": opp.createdBy.name,
      Description: opp.description,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Opportunities");

    // Write to base64 to send over JSON safely
    const base64 = XLSX.write(workbook, { type: "base64", bookType: "xlsx" });

    return ok({
      base64,
      filename: `opportunities-${new Date().toISOString().slice(0, 10)}.xlsx`,
    });
  } catch (error) {
    console.error("exportOpportunitiesExcel failed", error);
    return unknownError();
  }
}
