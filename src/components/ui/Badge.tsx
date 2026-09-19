import type { Stage, UserRole } from "@prisma/client";

const STAGE_CLASSES: Record<Stage, string> = {
  DRAFT: "bg-bg text-muted-fg border-border-strong",
  UNDER_REVIEW: "bg-warning-soft text-warning border-warning/30",
  APPROVED: "bg-success-soft text-success border-success/30",
  REJECTED: "bg-danger-soft text-danger border-danger/30",
};

export const STAGE_LABELS: Record<Stage, string> = {
  DRAFT: "Draft",
  UNDER_REVIEW: "Under review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export function StageBadge({ stage }: { stage: Stage }) {
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${STAGE_CLASSES[stage]}`}
    >
      {STAGE_LABELS[stage]}
    </span>
  );
}

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Admin",
  REVIEWER: "Reviewer",
  VIEWER: "Viewer",
};

export function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span className="inline-flex items-center rounded border border-border-strong bg-bg px-2 py-0.5 text-xs font-medium text-muted-fg">
      {ROLE_LABELS[role]}
    </span>
  );
}

export function ArchivedBadge() {
  return (
    <span className="inline-flex items-center rounded border border-border-strong bg-bg px-2 py-0.5 text-xs font-medium text-muted-fg">
      Archived
    </span>
  );
}
