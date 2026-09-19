"use client";

import useSWR from "swr";
import { UserRole } from "@prisma/client";
import { KanbanBoard } from "@/components/opportunities/KanbanBoard";
import { changeOpportunityStage } from "@/actions/stage";
import { listOpportunities } from "@/actions/opportunities";
import { ErrorState } from "@/components/ui/states";
import type { ActionResult } from "@/lib/action-result";
import { canChangeStage } from "@/lib/permissions";
import { toast } from "sonner";
import { OpportunityListItem } from "@/lib/dto";
import type { OpportunityListResult } from "@/actions/opportunities";

export function BoardClient({
  initial,
  role,
}: {
  initial: ActionResult<OpportunityListResult>;
  role: UserRole;
}) {
  const { data: result, mutate } = useSWR(
    ["board-opportunities"],
    () => listOpportunities({
      page: 1,
      stage: "ALL",
      archived: "ACTIVE",
      q: "",
      currency: "ALL",
      sort: "submissionDate",
      dir: "desc"
    }),
    { fallbackData: initial }
  );

  if (!result) {
    return null; // or a loading spinner
  }

  if (!result.ok) {
    return <ErrorState message={result.error.message} onRetry={() => mutate()} />;
  }

  async function handleStageChange(id: string, newStage: any) {
    if (!canChangeStage(role)) {
      toast.error("You don't have permission to change stages.");
      return;
    }
    
    // For Kanban drag-and-drop, we don't ask for rationale to keep it fast, 
    // or we could pop a modal. For simplicity, we just send a default rationale or empty.
    const res = await changeOpportunityStage({
      opportunityId: id,
      stage: newStage,
      rationale: "Moved via Kanban board",
    });

    if (!res.ok) {
      toast.error(res.error.message);
    }
    
    mutate(); // Refresh the board
  }

  return (
    <div className="flex h-full flex-col gap-6 overflow-hidden">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Kanban Board</h1>
        <p className="text-sm text-muted-foreground">
          Drag and drop opportunities to change their stages.
        </p>
      </div>

      <div className="min-h-0 flex-1">
        <KanbanBoard
          opportunities={result.data.items}
          canEdit={canChangeStage(role)}
          onStageChange={handleStageChange}
        />
      </div>
    </div>
  );
}
