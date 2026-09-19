"use client";

import { useState } from "react";
import type { OpportunityDTO } from "@/lib/dto";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import { updateOpportunityDetailsFormAction } from "@/actions/opportunity-details";
import { useActionFeedback } from "@/lib/use-action-feedback";
import { formatDateTime } from "@/lib/format";

export function OpportunityDetailsForm({
  opportunity,
  canEdit,
  onSaved,
}: {
  opportunity: OpportunityDTO;
  canEdit: boolean;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);

  const { formAction } = useActionFeedback(updateOpportunityDetailsFormAction, {
    successMessage: "Details updated.",
    onSuccess: () => {
      setEditing(false);
      onSaved();
    },
  });

  const priorityColors = {
    LOW: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    MEDIUM: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    HIGH: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  if (!editing) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-border p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Details</h3>
          {canEdit && (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              Edit
            </Button>
          )}
        </div>
        <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Priority</dt>
            <dd className="mt-1">
              <Badge className={priorityColors[opportunity.priority]} variant="secondary">
                {opportunity.priority}
              </Badge>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-muted-foreground">Deadline</dt>
            <dd className="mt-1 text-sm text-foreground">
              {opportunity.deadline ? formatDateTime(opportunity.deadline).split(',')[0] : "None"}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm font-medium text-muted-foreground">Tags</dt>
            <dd className="mt-1 flex flex-wrap gap-2">
              {opportunity.tags.length === 0 ? (
                <span className="text-sm text-muted-foreground">None</span>
              ) : (
                opportunity.tags.map((tag) => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))
              )}
            </dd>
          </div>
        </dl>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-lg border border-border p-5">
      <h3 className="text-sm font-semibold text-foreground">Edit details</h3>
      <input type="hidden" name="id" value={opportunity.id} />
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="priority">Priority</Label>
          <Select name="priority" defaultValue={opportunity.priority}>
            <SelectTrigger id="priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">LOW</SelectItem>
              <SelectItem value="MEDIUM">MEDIUM</SelectItem>
              <SelectItem value="HIGH">HIGH</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="deadline">Deadline</Label>
          <Input 
            id="deadline" 
            name="deadline" 
            type="date" 
            defaultValue={opportunity.deadline ? opportunity.deadline.toISOString().split('T')[0] : ""} 
          />
        </div>
      </div>
      
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tags">Tags (comma separated)</Label>
        <Input 
          id="tags" 
          name="tags" 
          defaultValue={opportunity.tags.join(", ")} 
          placeholder="e.g. saas, seed, fintech" 
        />
      </div>

      <div className="flex justify-end gap-2 mt-2">
        <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
          Cancel
        </Button>
        <SubmitButton pendingLabel="Saving…">Save</SubmitButton>
      </div>
    </form>
  );
}
