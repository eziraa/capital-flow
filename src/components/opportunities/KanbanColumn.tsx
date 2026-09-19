"use client";

import { useSortable } from "@dnd-kit/sortable";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Stage } from "@prisma/client";
import { KanbanCard } from "@/components/opportunities/KanbanCard";
import type { OpportunityListItem } from "@/lib/dto";
import { STAGE_LABELS, STAGE_TONE } from "@/components/ui/status-badges";

export function KanbanColumn({
  stage,
  items,
  canEdit,
  onCardClick,
}: {
  stage: Stage;
  items: OpportunityListItem[];
  canEdit: boolean;
  onCardClick: (id: string) => void;
}) {
  const { setNodeRef } = useSortable({
    id: stage,
    data: { type: "Column", stage },
    disabled: !canEdit,
  });

  const itemIds = items.map((i) => i.id);

  const colors = {
    default: "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800",
    warning: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50",
    success: "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/50",
    destructive: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50",
  };
  const tone = STAGE_TONE[stage];

  return (
    <div
      ref={setNodeRef}
      className={`flex h-full w-[320px] shrink-0 flex-col rounded-lg border ${colors[tone]} p-3`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">{STAGE_LABELS[stage]}</h3>
        <span className="flex size-6 items-center justify-center rounded-full bg-background text-xs font-medium text-muted-foreground shadow-sm">
          {items.length}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto min-h-[150px]">
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          {items.map((item) => (
            <KanbanCard
              key={item.id}
              item={item}
              disabled={!canEdit}
              onClick={() => onCardClick(item.id)}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
