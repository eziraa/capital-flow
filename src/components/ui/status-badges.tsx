import type { Stage, UserRole } from "@prisma/client";

import { Badge } from "@/components/ui/badge";

export const STAGE_LABELS: Record<Stage, string> = {
  DRAFT: "Draft",
  UNDER_REVIEW: "Under review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const STAGE_VARIANT: Record<Stage, "outline" | "warning" | "success" | "destructive"> = {
  DRAFT: "outline",
  UNDER_REVIEW: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
};

export function StageBadge({ stage }: { stage: Stage }) {
  return <Badge variant={STAGE_VARIANT[stage]}>{STAGE_LABELS[stage]}</Badge>;
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
