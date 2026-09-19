import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { BoardClient } from "./BoardClient";
import { listOpportunities } from "@/actions/opportunities";

export const metadata = { title: "Kanban Board — Capital Opportunities Tracker" };

export default async function KanbanBoardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  // Fetch all active opportunities to display on the board
  // We don't paginate the board right now since it's an overview
  const initial = await listOpportunities({
    page: 1,
    stage: "ALL",
    archived: "ACTIVE",
    q: "",
    currency: "ALL",
    sort: "submissionDate",
    dir: "desc"
  });

  return <BoardClient initial={initial} role={session.user.role} />;
}
