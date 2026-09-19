"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Stage } from "@prisma/client";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { KanbanColumn } from "@/components/opportunities/KanbanColumn";
import { KanbanCard } from "@/components/opportunities/KanbanCard";
import type { OpportunityListItem } from "@/lib/dto";

export function KanbanBoard({
  opportunities,
  onStageChange,
  canEdit,
}: {
  opportunities: OpportunityListItem[];
  onStageChange: (id: string, newStage: Stage) => void;
  canEdit: boolean;
}) {
  const router = useRouter();
  
  // We manage the local state of opportunities for instant UI updates during drag
  const [items, setItems] = useState<OpportunityListItem[]>(opportunities);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Update local items when props change (e.g. after a mutation)
  useMemo(() => {
    setItems(opportunities);
  }, [opportunities]);

  const columns = useMemo(() => Object.values(Stage), []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    const isActiveTask = items.some((i) => i.id === activeId);
    const isOverTask = items.some((i) => i.id === overId);
    const isOverColumn = columns.includes(overId as Stage);

    if (!isActiveTask) return;

    // Dropping a task over another task
    if (isActiveTask && isOverTask) {
      setItems((prev) => {
        const activeIndex = prev.findIndex((t) => t.id === activeId);
        const overIndex = prev.findIndex((t) => t.id === overId);
        
        if (prev[activeIndex].stage !== prev[overIndex].stage) {
          const newItems = [...prev];
          newItems[activeIndex].stage = prev[overIndex].stage;
          return arrayMove(newItems, activeIndex, overIndex);
        }
        return arrayMove(prev, activeIndex, overIndex);
      });
    }

    // Dropping a task over an empty column area
    if (isActiveTask && isOverColumn) {
      setItems((prev) => {
        const activeIndex = prev.findIndex((t) => t.id === activeId);
        const newItems = [...prev];
        newItems[activeIndex].stage = overId as Stage;
        return arrayMove(newItems, activeIndex, activeIndex); // just change stage, keep at end
      });
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeItem = items.find((i) => i.id === active.id);
    const originalItem = opportunities.find((i) => i.id === active.id);

    if (activeItem && originalItem && activeItem.stage !== originalItem.stage) {
      onStageChange(activeItem.id, activeItem.stage);
    }
  }

  const activeItem = useMemo(
    () => items.find((i) => i.id === activeId),
    [activeId, items]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full w-full gap-4 overflow-x-auto pb-4">
        {columns.map((stage) => (
          <KanbanColumn
            key={stage}
            stage={stage}
            items={items.filter((i) => i.stage === stage)}
            canEdit={canEdit}
            onCardClick={(id) => router.push(`/opportunities/${id}`)}
          />
        ))}
      </div>
      <DragOverlay>
        {activeItem ? <KanbanCard item={activeItem} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
