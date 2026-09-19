import { describeActivity } from "@/lib/activity-description";
import { formatDateTime } from "@/lib/format";
import type { ActivityDTO } from "@/lib/dto";

export function ActivityTimeline({ activities }: { activities: ActivityDTO[] }) {
  if (activities.length === 0) {
    return <p className="text-sm text-muted">No activity yet.</p>;
  }

  return (
    <ol className="flex flex-col gap-4">
      {activities.map((activity) => (
        <li key={activity.id} className="border-l-2 border-border pl-4">
          <p className="text-sm text-fg">{describeActivity(activity)}</p>
          {activity.type === "COMMENT_ADDED" && activity.comment ? (
            <p className="mt-1 whitespace-pre-wrap rounded-md bg-bg px-3 py-2 text-sm text-muted-fg">
              {activity.comment.body}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-muted">{formatDateTime(activity.createdAt)}</p>
        </li>
      ))}
    </ol>
  );
}
