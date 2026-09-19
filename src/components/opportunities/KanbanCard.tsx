"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Clock } from "lucide-react";
import type { OpportunityListItem } from "@/lib/dto";
import { formatAmount, formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export function KanbanCard({
  item,
  disabled,
  isOverlay,
  onClick,
}: {
  item: OpportunityListItem;
  disabled?: boolean;
  isOverlay?: boolean;
  onClick?: () => void;
}) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: item.id,
    data: { type: "Task", item },
    disabled,
  });

  const style = {
    transition,
    transform: CSS.Transform.toString(transform),
  };

  const priorityColors = {
    LOW: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    MEDIUM: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    HIGH: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={isDragging ? undefined : onClick}
      className={`group relative flex cursor-grab flex-col gap-2 rounded-md border bg-card p-3 shadow-sm active:cursor-grabbing hover:border-primary/50 ${
        isDragging && !isOverlay ? "opacity-30" : ""
      } ${isOverlay ? "scale-105 shadow-md ring-2 ring-primary/20" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium leading-tight text-foreground">{item.companyName}</h4>
        {item.priority && (
          <Badge variant="secondary" className={`px-1.5 py-0 text-[10px] uppercase leading-4 ${priorityColors[item.priority]}`}>
            {item.priority}
          </Badge>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium text-foreground">{formatAmount(item.requestedAmount, item.currency)}</span>
        <span>{formatDate(item.submissionDate)}</span>
      </div>

      <div className="flex items-center justify-between gap-2 mt-1">
        <div className="flex flex-wrap gap-1">
          {item.tags?.slice(0, 2).map(tag => (
             <span key={tag} className="rounded border bg-muted/50 px-1 text-[10px] text-muted-foreground">{tag}</span>
          ))}
          {(item.tags?.length ?? 0) > 2 && (
             <span className="rounded border bg-muted/50 px-1 text-[10px] text-muted-foreground">+{item.tags.length - 2}</span>
          )}
        </div>
        
        {item.reviewer && (
          <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary text-[10px] font-medium text-secondary-foreground" title={`Reviewer: ${item.reviewer.name}`}>
            {item.reviewer.name.charAt(0)}
          </div>
        )}
      </div>
      
      {item.deadline && (
        <div className="flex items-center gap-1 text-[10px] text-destructive mt-1">
           <Clock className="size-3" />
           <span>Due {formatDate(item.deadline)}</span>
        </div>
      )}
    </div>
  );
}
