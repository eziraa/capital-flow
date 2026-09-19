import { STAGE_LABELS } from "@/components/ui/Badge";
import type { ActivityDTO } from "@/lib/dto";

export function describeActivity(activity: ActivityDTO): string {
  const actorName = activity.actor.name;

  switch (activity.type) {
    case "CREATED":
      return `${actorName} created this opportunity.`;

    case "STAGE_CHANGED":
      return `${actorName} changed the stage from ${
        activity.previousStage ? STAGE_LABELS[activity.previousStage] : "—"
      } to ${activity.newStage ? STAGE_LABELS[activity.newStage] : "—"}.`;

    case "REVIEWER_ASSIGNED": {
      const previous = activity.previousReviewer?.name;
      const next = activity.newReviewer?.name;
      if (previous && next) return `${actorName} reassigned the reviewer from ${previous} to ${next}.`;
      if (next) return `${actorName} assigned ${next} as reviewer.`;
      if (previous) return `${actorName} removed ${previous} as reviewer.`;
      return `${actorName} updated the reviewer assignment.`;
    }

    case "COMMENT_ADDED":
      return `${actorName} added a comment.`;

    case "ARCHIVED":
      return `${actorName} archived this opportunity.`;

    case "RESTORED":
      return `${actorName} restored this opportunity.`;

    default:
      return `${actorName} updated this opportunity.`;
  }
}
