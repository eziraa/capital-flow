import { CheckCircle2, Clock, FileEdit, XCircle, type LucideIcon } from "lucide-react";
import type { Stage, UserRole } from "@prisma/client";

import { Badge } from "@/components/ui/badge";

export const STAGE_LABELS: Record<Stage, string> = {
  DRAFT: "Draft",
  UNDER_REVIEW: "Under review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

/** Shared semantic tone per stage — drives both the badge variant and stat-card icon color. */
export const STAGE_TONE: Record<Stage, "default" | "warning" | "success" | "destructive"> = {
  DRAFT: "default",
  UNDER_REVIEW: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
};

export const STAGE_ICONS: Record<Stage, LucideIcon> = {
  DRAFT: FileEdit,
  UNDER_REVIEW: Clock,
  APPROVED: CheckCircle2,
  REJECTED: XCircle,
};

const STAGE_VARIANT: Record<Stage, "outline" | "warning" | "success" | "destructive"> = {
  DRAFT: "outline",
  UNDER_REVIEW: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
};

export function StageBadge({ stage }: { stage: Stage }) {
  const Icon = STAGE_ICONS[stage];
  return (
    <Badge variant={STAGE_VARIANT[stage]}>
      <Icon aria-hidden="true" />
      {STAGE_LABELS[stage]}
    </Badge>
  );
}

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Admin",
  REVIEWER: "Reviewer",
  VIEWER: "Viewer",
};

export function RoleBadge({ role }: { role: UserRole }) {
  return <Badge variant="secondary">{ROLE_LABELS[role]}</Badge>;
}

export function ArchivedBadge() {
  return <Badge variant="outline">Archived</Badge>;
}
